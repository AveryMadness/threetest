import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from "three/addons/libs/stats.module.js";
import { decode } from "base64";

async function getAvatar() {
    const res = await fetch("/scene.json");
    
    const data = await res.json();
    
    for (const [key, value] of Object.entries(data.files)) {
        if (key.endsWith(".png")) {
            data.files[key] = `data:image/png;base64,${value.content}`;
            
            continue;
        }
        
        const decoded = decode(value.content);
            
        data.files[key] = decoded;
    }
    
    return data;
}

let number = 0;

function createCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
        // change colour on every number cube
        color: number++ % 2 === 0 ? 0x00ff00 : 0xff0000,
        wireframe: true
    });
    
    return new THREE.Mesh(geometry, material);
}

function loadAvatar(avatar) {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    const mtlLoader = new MTLLoader();
    mtlLoader.setMaterialOptions({
        // fix model transparency
        side: THREE.DoubleSide
    });
    
    const mtl = mtlLoader.parse(avatar.files["scene.mtl"]);
    
    mtl
    
    // mtl.materialsInfo["Player11Mtl"].map_d = avatar.files["Player11Tex.png"];
    // mtl.materialsInfo["Player11Mtl"].map_ka = avatar.files["Player11Tex.png"];
    // mtl.materialsInfo["Player11Mtl"].map_kd = avatar.files["Player11Tex.png"];
    
    const objLoader = new OBJLoader()
        .setMaterials(mtl);
    
    scene.add(objLoader.parse(avatar.files["scene.obj"]));
    
    scene.add((() => {
        const cameraCube = createCube();
        cameraCube.position.set(avatar.camera.direction.x, avatar.camera.direction.y, avatar.camera.direction.z);
        return cameraCube;
    })());
    
    scene.add((() => {
        const lookAtCube = createCube();
        lookAtCube.position.set(avatar.camera.position.x, avatar.camera.position.y, avatar.camera.position.z);
        return lookAtCube;
    })());
    
    scene.add(createCube());
    
    const controls = new OrbitControls(camera, renderer.domElement);
    
    const { x, y, z } = avatar.camera.position;
    const { x: x2, y: y2, z: z2 } = avatar.camera.direction;
    
    console.log({ x, y, z }, { x2, y2, z2 });
    
    camera.position.set(x, y, z);
    controls.target.set(x - x2*5.5, y - y2*5.5, z - z2*5.5);
    controls.update();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const stats = Stats();
    document.body.appendChild(stats.dom);
    
    function animate() {
        requestAnimationFrame(animate)
    
        render()
    
        stats.update()
    }
    
    function render() {
        renderer.render(scene, camera)
    }
    
    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight)
        render();
    }
    
    animate()
}

(async () => {
    const avatar = await getAvatar();
    
    loadAvatar(avatar);
})();