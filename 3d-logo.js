/* =========================================================
   3d-logo.js — 3D-логотип НЕАЛИТ
   Исправление:
   - логотип в главном меню теперь корректно появляется сразу;
   - добавлен принудительный пересчёт размеров Three.js после показа меню;
   - проблема возникала из-за того, что контейнер был скрыт при первой загрузке.
   ========================================================= */

(function () {
    "use strict";

    const scenes = [];

    function getContainerSize(container) {
        const rect = container.getBoundingClientRect();

        return {
            width: Math.max(Math.round(rect.width || container.clientWidth || 1), 1),
            height: Math.max(Math.round(rect.height || container.clientHeight || 1), 1)
        };
    }

    function createRenderer(container) {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        const size = getContainerSize(container);

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.width, size.height);
        renderer.outputEncoding = THREE.sRGBEncoding;

        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";

        container.appendChild(renderer.domElement);

        return renderer;
    }

    function createLogoObject() {
        const group = new THREE.Group();

        const geometry = new THREE.TorusKnotGeometry(1.05, 0.28, 180, 24);

        const material = new THREE.MeshStandardMaterial({
            color: 0xddeeff,
            metalness: 0.72,
            roughness: 0.22,
            emissive: 0x0a2a55,
            emissiveIntensity: 0.28
        });

        const knot = new THREE.Mesh(geometry, material);
        group.add(knot);

        const ringGeometry = new THREE.TorusGeometry(1.7, 0.018, 16, 160);

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x8fc6ff,
            transparent: true,
            opacity: 0.42
        });

        const ringOne = new THREE.Mesh(ringGeometry, ringMaterial);
        ringOne.rotation.x = Math.PI / 2.35;
        group.add(ringOne);

        const ringTwo = ringOne.clone();
        ringTwo.rotation.x = Math.PI / 1.72;
        ringTwo.rotation.y = Math.PI / 3.2;
        group.add(ringTwo);

        return group;
    }

    function createLogoScene(container, options) {
        if (!container || typeof THREE === "undefined") {
            return null;
        }

        const settings = Object.assign({
            interactive: false,
            cameraZ: 5,
            autoSpeed: 0.004,
            scale: 1
        }, options || {});

        const size = getContainerSize(container);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            size.width / size.height,
            0.1,
            100
        );

        camera.position.set(0, 0, settings.cameraZ);

        const renderer = createRenderer(container);

        const logo = createLogoObject();
        logo.scale.setScalar(settings.scale);
        scene.add(logo);

        const ambient = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);

        const blueLight = new THREE.PointLight(0x4d9cff, 1.2, 10);
        blueLight.position.set(-3, 1.4, 2);
        scene.add(blueLight);

        let controls = null;

        if (settings.interactive && typeof THREE.OrbitControls === "function") {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.rotateSpeed = 0.55;
        }

        const sceneData = {
            container: container,
            scene: scene,
            camera: camera,
            renderer: renderer,
            logo: logo,
            controls: controls,
            settings: settings,
            isIntroFinished: false
        };

        scenes.push(sceneData);

        return sceneData;
    }

    function resizeScene(sceneData) {
        if (!sceneData || !sceneData.container) {
            return;
        }

        const size = getContainerSize(sceneData.container);

        sceneData.camera.aspect = size.width / size.height;
        sceneData.camera.updateProjectionMatrix();

        sceneData.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        sceneData.renderer.setSize(size.width, size.height);

        sceneData.renderer.render(sceneData.scene, sceneData.camera);
    }

    function refreshAllScenes() {
        scenes.forEach(resizeScene);
    }

    function refreshAllScenesSmoothly() {
        /*
           🔹 Что изменено:
           Контейнер логотипа в меню появляется не мгновенно, а через анимацию.
           Поэтому одного resize иногда мало. Делаем несколько мягких обновлений:
           сразу, через кадр, через 100 мс, 300 мс и 700 мс.
        */

        refreshAllScenes();

        window.requestAnimationFrame(refreshAllScenes);

        window.setTimeout(refreshAllScenes, 100);
        window.setTimeout(refreshAllScenes, 300);
        window.setTimeout(refreshAllScenes, 700);
        window.setTimeout(refreshAllScenes, 1100);
    }

    function animate() {
        window.requestAnimationFrame(animate);

        scenes.forEach(function (sceneData) {
            sceneData.logo.rotation.y += sceneData.settings.autoSpeed;
            sceneData.logo.rotation.x += sceneData.settings.autoSpeed * 0.26;

            if (sceneData.controls && !sceneData.isIntroFinished) {
                sceneData.controls.update();
            }

            sceneData.renderer.render(sceneData.scene, sceneData.camera);
        });
    }

    function setIntroFinished() {
        scenes.forEach(function (sceneData) {
            sceneData.isIntroFinished = true;

            if (sceneData.controls) {
                sceneData.controls.enabled = false;
            }
        });

        refreshAllScenesSmoothly();
    }

    function init() {
        const introContainer = document.getElementById("intro-3d-logo");
        const menuContainer = document.getElementById("menu-3d-logo");

        createLogoScene(introContainer, {
            interactive: true,
            cameraZ: 5.4,
            autoSpeed: 0.002,
            scale: 0.96
        });

        createLogoScene(menuContainer, {
            interactive: false,
            cameraZ: 5.4,
            autoSpeed: 0.006,
            scale: 0.86
        });

        window.addEventListener("resize", refreshAllScenesSmoothly);

        animate();

        window.setTimeout(refreshAllScenesSmoothly, 300);
    }

    window.NealitLogo = {
        setIntroFinished: setIntroFinished,
        refreshAll: refreshAllScenesSmoothly
    };

    document.addEventListener("DOMContentLoaded", init);
}());

(function () {
    "use strict";

    // Создаем сцену и камеру
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Создаем рендерер
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('3d-sky-container').appendChild(renderer.domElement);

    // Добавляем сферу с текстурой
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    const texture = new THREE.TextureLoader().load('path/to/sky.jpg');  // Путь к текстуре
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.set(0, 0, 1);

    // Анимация и рендеринг
    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.y += 0.001;  // Плавное вращение
        renderer.render(scene, camera);
    }

    animate();

    // Перерисовываем при изменении размера окна
    window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}());