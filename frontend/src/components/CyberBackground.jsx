import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─── Three.js Cybersecurity Animated Background ─────────────────────────────
// Shared component used by Login & Register pages
export default function CyberBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const w = mount.clientWidth;
        const h = mount.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
        camera.position.z = 400;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);

        // ── Floating Nodes (spheres that glow) ──────────────────────────────
        const NODE_COUNT = 80;
        const nodePositions = [];
        const nodeMeshes = [];

        const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.85 });
        const nodeGeo = new THREE.SphereGeometry(1.5, 8, 8);

        for (let i = 0; i < NODE_COUNT; i++) {
            const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 400
            );
            mesh.position.copy(pos);
            nodePositions.push(pos);
            nodeMeshes.push(mesh);
            scene.add(mesh);
        }

        // ── Connection Lines ────────────────────────────────────────────────
        const MAX_DIST = 140;
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.15 });
        const lines = [];

        for (let i = 0; i < NODE_COUNT; i++) {
            for (let j = i + 1; j < NODE_COUNT; j++) {
                if (nodePositions[i].distanceTo(nodePositions[j]) < MAX_DIST) {
                    const geo = new THREE.BufferGeometry().setFromPoints([
                        nodePositions[i], nodePositions[j]
                    ]);
                    const line = new THREE.Line(geo, lineMat.clone());
                    lines.push({ line, i, j });
                    scene.add(line);
                }
            }
        }

        // ── Particle Field (background dots) ────────────────────────────────
        const PARTICLE_COUNT = 500;
        const pPositions = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pPositions[i * 3] = (Math.random() - 0.5) * 1200;
            pPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
            pPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x00aaff, size: 1.2, transparent: true, opacity: 0.35 });
        scene.add(new THREE.Points(pGeo, pMat));

        // ── Node velocity (drift) ───────────────────────────────────────────
        const velocities = nodeMeshes.map(() => new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.15
        ));

        // ── Mouse parallax ──────────────────────────────────────────────────
        let mouseX = 0, mouseY = 0;
        const onMouseMove = (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMouseMove);

        // ── Animation loop ──────────────────────────────────────────────────
        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);

            // Drift nodes
            for (let i = 0; i < NODE_COUNT; i++) {
                nodePositions[i].add(velocities[i]);
                nodeMeshes[i].position.copy(nodePositions[i]);

                // Bounce off walls
                ['x', 'y', 'z'].forEach(axis => {
                    const limit = axis === 'z' ? 200 : (axis === 'x' ? 400 : 300);
                    if (Math.abs(nodePositions[i][axis]) > limit) velocities[i][axis] *= -1;
                });
            }

            // Update line positions & opacity based on distance
            lines.forEach(({ line, i, j }) => {
                const dist = nodePositions[i].distanceTo(nodePositions[j]);
                const geo = line.geometry;
                const pos = geo.attributes.position;
                pos.setXYZ(0, nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
                pos.setXYZ(1, nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
                pos.needsUpdate = true;
                line.material.opacity = dist < MAX_DIST ? (1 - dist / MAX_DIST) * 0.4 : 0;
            });

            // Camera parallax
            camera.position.x += (mouseX * 30 - camera.position.x) * 0.04;
            camera.position.y += (mouseY * 20 - camera.position.y) * 0.04;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };
        animate();

        // ── Resize handler ──────────────────────────────────────────────────
        const onResize = () => {
            const w2 = mount.clientWidth, h2 = mount.clientHeight;
            camera.aspect = w2 / h2;
            camera.updateProjectionMatrix();
            renderer.setSize(w2, h2);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
    );
}
