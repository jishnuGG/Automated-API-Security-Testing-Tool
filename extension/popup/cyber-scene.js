// ============================================================
// CYBER-SCENE.JS — Three.js Animated 3D Cyberpunk Background
// ============================================================

(function () {
    'use strict';

    const canvas = document.getElementById('cyber-canvas');
    if (!canvas) return;

    // ---- RENDERER ----
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(420, 560);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    // ---- SCENE & CAMERA ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000a14, 0.035);

    const camera = new THREE.PerspectiveCamera(60, 420 / 560, 0.1, 100);
    camera.position.set(0, 0, 18);
    camera.lookAt(0, 0, 0);

    // ---- COLORS ----
    const CYAN = new THREE.Color(0x00ffc8);
    const BLUE = new THREE.Color(0x00a8ff);
    const MAGENTA = new THREE.Color(0xbf00ff);
    const RED = new THREE.Color(0xff3a5e);

    // ============================================================
    // 1. WIREFRAME ICOSAHEDRON (rotating cyber-globe)
    // ============================================================
    const icoGeom = new THREE.IcosahedronGeometry(5, 1);
    const icoMat = new THREE.MeshBasicMaterial({
        color: CYAN,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const icosphere = new THREE.Mesh(icoGeom, icoMat);
    scene.add(icosphere);

    // Inner glow sphere
    const innerGlowGeom = new THREE.IcosahedronGeometry(4.8, 2);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: BLUE,
        wireframe: true,
        transparent: true,
        opacity: 0.04
    });
    const innerGlow = new THREE.Mesh(innerGlowGeom, innerGlowMat);
    scene.add(innerGlow);

    // ============================================================
    // 2. FLOATING PARTICLE FIELD
    // ============================================================
    const PARTICLE_COUNT = 350;
    const particlesGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);

    const colorPalette = [CYAN, BLUE, MAGENTA];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 30;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 40;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 20;

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        particleColors[i3] = color.r;
        particleColors[i3 + 1] = color.g;
        particleColors[i3 + 2] = color.b;

        particleSpeeds[i] = 0.002 + Math.random() * 0.008;
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    // ============================================================
    // 3. DATA STREAM LINES (vertical flowing lines)
    // ============================================================
    const LINE_COUNT = 12;
    const dataLines = [];

    for (let i = 0; i < LINE_COUNT; i++) {
        const points = [];
        const segments = 30;
        const x = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 10 - 5;

        for (let j = 0; j < segments; j++) {
            const y = -20 + (j / segments) * 40;
            points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const colors = new Float32Array(segments * 3);
        for (let j = 0; j < segments; j++) {
            const t = j / segments;
            const color = new THREE.Color().lerpColors(CYAN, MAGENTA, t);
            colors[j * 3] = color.r;
            colors[j * 3 + 1] = color.g;
            colors[j * 3 + 2] = color.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const line = new THREE.Line(geometry, material);
        line.userData = {
            speed: 0.01 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2
        };
        scene.add(line);
        dataLines.push(line);
    }

    // ============================================================
    // 4. CONNECTION NETWORK (edges between nearby particles)
    // ============================================================
    const CONNECTION_DISTANCE = 5;
    const MAX_CONNECTIONS = 60;
    const connectionGeom = new THREE.BufferGeometry();
    const connectionPositions = new Float32Array(MAX_CONNECTIONS * 6); // 2 vertices per line
    connectionGeom.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
    connectionGeom.setDrawRange(0, 0);

    const connectionMat = new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const connections = new THREE.LineSegments(connectionGeom, connectionMat);
    scene.add(connections);

    // ============================================================
    // 5. HEXAGONAL GRID (bottom decoration)
    // ============================================================
    const hexGroup = new THREE.Group();
    hexGroup.position.set(0, -12, -5);
    hexGroup.rotation.x = -Math.PI / 4;

    for (let row = -3; row <= 3; row++) {
        for (let col = -4; col <= 4; col++) {
            const hexShape = new THREE.Shape();
            const size = 0.8;
            for (let k = 0; k < 6; k++) {
                const angle = (Math.PI / 3) * k - Math.PI / 6;
                const px = size * Math.cos(angle);
                const py = size * Math.sin(angle);
                if (k === 0) hexShape.moveTo(px, py);
                else hexShape.lineTo(px, py);
            }
            hexShape.closePath();

            const hexGeom = new THREE.ShapeGeometry(hexShape);
            const hexEdges = new THREE.EdgesGeometry(hexGeom);
            const hexLine = new THREE.LineSegments(hexEdges, new THREE.LineBasicMaterial({
                color: CYAN,
                transparent: true,
                opacity: 0.04 + Math.random() * 0.04,
                blending: THREE.AdditiveBlending
            }));

            const offsetX = col * 1.5;
            const offsetY = row * 1.732 + (col % 2 !== 0 ? 0.866 : 0);
            hexLine.position.set(offsetX, offsetY, 0);
            hexGroup.add(hexLine);
        }
    }
    scene.add(hexGroup);

    // ============================================================
    // 6. ORBITING RING PARTICLES
    // ============================================================
    const RING_PARTICLE_COUNT = 80;
    const ringGeom = new THREE.BufferGeometry();
    const ringPositions = new Float32Array(RING_PARTICLE_COUNT * 3);
    const ringColors = new Float32Array(RING_PARTICLE_COUNT * 3);

    for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
        const angle = (i / RING_PARTICLE_COUNT) * Math.PI * 2;
        const radius = 7 + (Math.random() - 0.5) * 0.5;
        ringPositions[i * 3] = Math.cos(angle) * radius;
        ringPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        ringPositions[i * 3 + 2] = Math.sin(angle) * radius;

        const color = new THREE.Color().lerpColors(CYAN, BLUE, Math.random());
        ringColors[i * 3] = color.r;
        ringColors[i * 3 + 1] = color.g;
        ringColors[i * 3 + 2] = color.b;
    }

    ringGeom.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeom.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

    const ringMat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const ring = new THREE.Points(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 5;
    scene.add(ring);

    // ============================================================
    // THREAT FLASH EFFECT
    // ============================================================
    let threatFlashIntensity = 0;

    window.triggerThreatFlash = function () {
        threatFlashIntensity = 1.0;
    };

    // ============================================================
    // ANIMATION LOOP
    // ============================================================
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Rotate icosphere
        icosphere.rotation.y = elapsed * 0.08;
        icosphere.rotation.x = Math.sin(elapsed * 0.05) * 0.1;

        innerGlow.rotation.y = -elapsed * 0.06;
        innerGlow.rotation.z = elapsed * 0.04;

        // Animate particles (gentle float)
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            positions[i3 + 1] += particleSpeeds[i];

            // Reset particles that drift too high
            if (positions[i3 + 1] > 20) {
                positions[i3 + 1] = -20;
                positions[i3] = (Math.random() - 0.5) * 30;
                positions[i3 + 2] = (Math.random() - 0.5) * 20;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Animate data lines (vertical shimmer)
        dataLines.forEach(function (line) {
            line.material.opacity = 0.03 + Math.sin(elapsed * line.userData.speed * 50 + line.userData.phase) * 0.03;
        });

        // Update connections between nearby particles
        let connIdx = 0;
        const connPos = connections.geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT && connIdx < MAX_CONNECTIONS; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT && connIdx < MAX_CONNECTIONS; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONNECTION_DISTANCE) {
                    const ci = connIdx * 6;
                    connPos[ci] = positions[i * 3];
                    connPos[ci + 1] = positions[i * 3 + 1];
                    connPos[ci + 2] = positions[i * 3 + 2];
                    connPos[ci + 3] = positions[j * 3];
                    connPos[ci + 4] = positions[j * 3 + 1];
                    connPos[ci + 5] = positions[j * 3 + 2];
                    connIdx++;
                }
            }
        }
        connections.geometry.setDrawRange(0, connIdx * 2);
        connections.geometry.attributes.position.needsUpdate = true;

        // Ring rotation
        ring.rotation.z = elapsed * 0.15;
        ring.rotation.y = elapsed * 0.08;

        // Hex grid subtle animation
        hexGroup.children.forEach(function (hex, idx) {
            hex.material.opacity = 0.03 + Math.sin(elapsed * 0.5 + idx * 0.3) * 0.02;
        });

        // Threat flash effect - temporarily tint the scene red
        if (threatFlashIntensity > 0) {
            icoMat.color.lerpColors(CYAN, RED, threatFlashIntensity);
            icoMat.opacity = 0.12 + threatFlashIntensity * 0.15;
            threatFlashIntensity *= 0.96; // Decay
            if (threatFlashIntensity < 0.01) {
                threatFlashIntensity = 0;
                icoMat.color.copy(CYAN);
                icoMat.opacity = 0.12;
            }
        }

        // Gentle camera sway
        camera.position.x = Math.sin(elapsed * 0.1) * 0.3;
        camera.position.y = Math.cos(elapsed * 0.08) * 0.2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize (though popup is fixed, belt & suspenders)
    window.addEventListener('resize', function () {
        renderer.setSize(420, 560);
    });

})();
