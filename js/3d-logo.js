// js/3d-logo.js
// =========================================
// 3D ЛОГОТИП (Three.js)
// Инициализация сцены, камеры, рендера, освещения
// Управление режимами: авто-вращение + ручное управление
// =========================================

const Logo3D = {
    scene: null, camera: null, renderer: null, controls: null,
    logoMesh: null, mode: 'free', container: null,

    init() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(400, 400);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x87ceeb, 1.2);
        dirLight.position.set(5, 5, 5); this.scene.add(dirLight);
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-5, -3, -5); this.scene.add(backLight);

        // Заглушка логотипа
        const geometry = new THREE.TorusKnotGeometry(1, 0.35, 100, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xb0d4f1, metalness: 0.6, roughness: 0.2, emissive: 0x0a192f, emissiveIntensity: 0.2
        });
        this.logoMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.logoMesh);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.2;

        window.addEventListener('resize', () => this.onResize());
        this.animate();
    },

    setMode(newMode) {
        if (newMode === 'header') {
            this.mode = 'header';
            this.controls.enabled = false;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 3.5;
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.mode === 'header' && this.logoMesh) {
            this.logoMesh.rotation.z = Math.sin(Date.now() * 0.001) * 0.03;
        }
        this.renderer.render(this.scene, this.camera);
    },

    onResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // 🛡 Защита от исчезновения: игнорируем ресайз, если контейнер схлопнулся во время анимации
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        // false = не менять CSS-стили канваса (GSAP управляет размером контейнера)
        this.renderer.setSize(width, height, false);
    }
};

window.Logo3D = Logo3D;
document.addEventListener('DOMContentLoaded', () => { Logo3D.init(); });