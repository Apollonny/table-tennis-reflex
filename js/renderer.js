












class TableTennisRenderer {
    constructor(canvasContainer) {
        this.container = canvasContainer;
        this.scene = null;
        this.camera = null;
        this.renderer = null;


        this.tableMesh = null;
        this.netMesh = null;
        this.ballMesh = null;
        this.ballShadow = null;
        this.playerPaddle = null;
        this.opponentPaddle = null;


        this.particles = [];
        this.bounceRings = [];
        this.speedTrail = [];
        this.maxTrailPoints = 14;
        this.sparkPool = [];
        this.bounceRingPool = [];
        this.sparkGeometry = null;
        this.sparkMaterial = null;
        this.bounceRingGeometry = null;


        this.arcadeServeTargetGroup = null;
        this.arcadeServeZones = [];
        this.arcadeServeAimMarker = null;

        this.cameraBasePos = new THREE.Vector3(0, 2.14, 3.42);
        this.cameraShake = 0;

        this.init();
    }

    updateCameraForAspect(aspect) {
        if (aspect < 1.0) {

            const aspectFactor = Math.max(0.42, Math.min(1.0, aspect));
            this.cameraBasePos.set(
                0,
                2.14 + (1.0 - aspectFactor) * 0.40,
                3.42 + (1.0 - aspectFactor) * 1.65
            );
            this.camera.fov = Math.min(66, 48 + (1.0 - aspectFactor) * 20);
        } else {

            this.cameraBasePos.set(0, 2.14, 3.42);
            this.camera.fov = 48;
        }
        this.camera.position.copy(this.cameraBasePos);
        this.camera.lookAt(0, 0.75, -0.22);
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;


        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0e1118);
        this.scene.fog = new THREE.FogExp2(0x0e1118, 0.024);


        this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
        this.updateCameraForAspect(aspect);


        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (width < 900 && ('ontouchstart' in window));
        const maxPixelRatio = isMobile ? 1.5 : 2.0;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.20;
        this.container.appendChild(this.renderer.domElement);


        this.setupLighting();


        this.initVFXResources();


        this.buildGymnasium();


        this.buildTable();


        this.buildArcadeServeTargets();


        this.buildPaddles();


        this.buildBall();


        window.addEventListener('resize', () => this.onWindowResize());
    }

    initVFXResources() {
        this.sparkGeometry = new THREE.SphereGeometry(0.009, 8, 8);
        this.sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xffe600 });
        this.bounceRingGeometry = new THREE.RingGeometry(0.02, 0.045, 32);
    }

    setupLighting() {

        const ambient = new THREE.AmbientLight(0xfff5ea, 0.65);
        this.scene.add(ambient);


        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.innerWidth < 900 && ('ontouchstart' in window));
        const shadowRes = isMobile ? 1024 : 2048;

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(1.2, 5.8, 0.8);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = shadowRes;
        mainLight.shadow.mapSize.height = shadowRes;
        mainLight.shadow.camera.near = 1.0;
        mainLight.shadow.camera.far = 14;
        mainLight.shadow.camera.left = -2.8;
        mainLight.shadow.camera.right = 2.8;
        mainLight.shadow.camera.top = 3.0;
        mainLight.shadow.camera.bottom = -3.0;
        mainLight.shadow.bias = -0.0004;
        this.scene.add(mainLight);


        const fillLight = new THREE.DirectionalLight(0x90b8f8, 0.75);
        fillLight.position.set(-2.5, 4.5, -3.5);
        this.scene.add(fillLight);


        const rimLight = new THREE.DirectionalLight(0xffe0b2, 0.85);
        rimLight.position.set(2.2, 3.8, 3.2);
        this.scene.add(rimLight);


        const tableSpot = new THREE.SpotLight(0xffffff, 1.1, 8, Math.PI / 4, 0.45, 1.0);
        tableSpot.position.set(0, 4.2, 0);
        tableSpot.target.position.set(0, 0.76, 0);
        this.scene.add(tableSpot);
        this.scene.add(tableSpot.target);
    }

    createParquetTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');


        ctx.fillStyle = '#b77b42';
        ctx.fillRect(0, 0, 1024, 1024);

        const plankW = 128;
        const plankH = 32;
        for (let y = 0; y < 1024; y += plankH) {
            const row = Math.floor(y / plankH);
            const xOffset = (row % 2) * (plankW / 2);
            for (let x = -plankW; x < 1024 + plankW; x += plankW) {
                const shade = Math.sin(x * 15.3 + y * 37.1) * 16;
                const r = Math.min(255, Math.max(0, 198 + shade));
                const g = Math.min(255, Math.max(0, 136 + shade * 0.82));
                const b = Math.min(255, Math.max(0, 82 + shade * 0.65));
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x + xOffset, y, plankW - 2, plankH - 2);


                ctx.fillStyle = 'rgba(100, 60, 25, 0.12)';
                ctx.fillRect(x + xOffset, y + 8, plankW - 2, 2);
                ctx.fillRect(x + xOffset, y + 20, plankW - 2, 1.5);


                ctx.strokeStyle = '#6b4019';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + xOffset, y, plankW, plankH);
            }
        }


        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 6;
        ctx.strokeRect(120, 120, 1024 - 240, 1024 - 240);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 7);
        return texture;
    }

    createTableTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');


        ctx.fillStyle = '#176196';
        ctx.fillRect(0, 0, 1024, 2048);


        const grad = ctx.createRadialGradient(512, 1024, 200, 512, 1024, 1100);
        grad.addColorStop(0, 'rgba(38, 128, 192, 0.35)');
        grad.addColorStop(1, 'rgba(10, 50, 84, 0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 2048);


        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 18;
        ctx.strokeRect(9, 9, 1024 - 18, 2048 - 18);


        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(512, 0);
        ctx.lineTo(512, 2048);
        ctx.stroke();


        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('ITTF APPROVED', 36, 60);
        ctx.fillText('ITTF APPROVED', 1024 - 240, 2048 - 40);

        return new THREE.CanvasTexture(canvas);
    }

    createBarrierTexture(title = 'TABLE TENNIS REFLEX') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');


        ctx.fillStyle = '#0e2a4a';
        ctx.fillRect(0, 0, 512, 128);


        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(0, 0, 512, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 122, 512, 6);


        ctx.font = '900 32px "Chakra Petch", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        if (title === 'TABLE TENNIS REFLEX') {
            const textPart1 = 'TABLE TENNIS ';
            const textPart2 = 'REFLEX';
            const w1 = ctx.measureText(textPart1).width;
            const w2 = ctx.measureText(textPart2).width;
            const startX = 256 - (w1 + w2) / 2;

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(textPart1, startX, 68);
            ctx.fillStyle = '#ffc83b';
            ctx.fillText(textPart2, startX + w1, 68);
        } else {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(title, 256, 68);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = 'bold 15px "Chakra Petch", sans-serif';
        ctx.fillText('★ CHAMPIONSHIP SERIES ★', 256, 96);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    createNetTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 256, 64);


        ctx.strokeStyle = 'rgba(240, 245, 255, 0.78)';
        ctx.lineWidth = 1.1;
        const step = 5;
        for (let x = 0; x <= 256; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 10);
            ctx.lineTo(x, 64);
            ctx.stroke();
        }
        for (let y = 10; y <= 64; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }


        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 10);
        ctx.fillStyle = '#b0bec5';
        ctx.fillRect(0, 9, 256, 1.5);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(16, 1);
        return texture;
    }

    createPaddleEdgeTapeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');


        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, 256, 32);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 252, 28);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ WORLD TOUR ★', 128, 20);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(6, 1);
        return tex;
    }

    buildGymnasium() {
        const arenaGroup = new THREE.Group();


        const floorGeo = new THREE.PlaneGeometry(36, 44);
        const parquetTex = this.createParquetTexture();
        const floorMat = new THREE.MeshStandardMaterial({
            map: parquetTex,
            roughness: 0.22,
            metalness: 0.16
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        arenaGroup.add(floor);


        const barrierTex = this.createBarrierTexture();
        const barrierMat = new THREE.MeshStandardMaterial({
            map: barrierTex,
            roughness: 0.45,
            metalness: 0.1
        });
        const barrierBackMat = new THREE.MeshStandardMaterial({ color: 0x0a1c30, roughness: 0.7 });


        const createBarrierSection = (length, x, z, rotY) => {
            const bGroup = new THREE.Group();
            const bGeo = new THREE.PlaneGeometry(length, 0.72);
            const front = new THREE.Mesh(bGeo, barrierMat);
            front.position.set(0, 0.36, 0.05);
            front.rotation.x = -0.12;
            front.castShadow = true;
            bGroup.add(front);

            const back = new THREE.Mesh(bGeo, barrierBackMat);
            back.position.set(0, 0.36, -0.05);
            back.rotation.x = 0.12;
            bGroup.add(back);

            bGroup.position.set(x, 0, z);
            bGroup.rotation.y = rotY;
            return bGroup;
        };


        arenaGroup.add(createBarrierSection(7.2, 0, -4.2, 0));

        arenaGroup.add(createBarrierSection(7.2, 0, 4.2, Math.PI));

        arenaGroup.add(createBarrierSection(8.4, -3.6, 0, Math.PI / 2));

        arenaGroup.add(createBarrierSection(8.4, 3.6, 0, -Math.PI / 2));


        const wallGeo = new THREE.PlaneGeometry(36, 16);
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 1024;
        wallCanvas.height = 512;
        const wCtx = wallCanvas.getContext('2d');


        wCtx.fillStyle = '#121722';
        wCtx.fillRect(0, 0, 1024, 512);


        for (let tier = 0; tier < 8; tier++) {
            const yPos = 140 + tier * 42;
            wCtx.fillStyle = tier % 2 === 0 ? '#1e293b' : '#182232';
            wCtx.fillRect(0, yPos, 1024, 38);


            for (let sx = 10; sx < 1024; sx += 20) {
                wCtx.fillStyle = ((sx + tier * 10) % 60 === 0) ? '#d32f2f' : '#1e40af';
                wCtx.fillRect(sx, yPos + 6, 14, 22);
            }
        }


        wCtx.fillStyle = '#090d14';
        wCtx.fillRect(200, 20, 624, 90);
        wCtx.strokeStyle = '#00e5ff';
        wCtx.lineWidth = 3;
        wCtx.strokeRect(200, 20, 624, 90);

        wCtx.fillStyle = '#ffd700';
        wCtx.font = '900 28px sans-serif';
        wCtx.textAlign = 'center';
        wCtx.fillText('WORLD TABLE TENNIS CHAMPIONSHIP 2026', 512, 60);

        wCtx.fillStyle = '#00e5ff';
        wCtx.font = 'bold 18px sans-serif';
        wCtx.fillText('★ GRAND FINALS LIVE ★', 512, 90);

        const wallTex = new THREE.CanvasTexture(wallCanvas);
        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTex,
            roughness: 0.7
        });
        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, 8, -12);
        arenaGroup.add(backWall);


        const trussMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 });
        const trussGeo = new THREE.BoxGeometry(0.12, 0.12, 10);

        const trussL = new THREE.Mesh(trussGeo, trussMat);
        trussL.position.set(-2.2, 5.2, 0);
        const trussR = new THREE.Mesh(trussGeo, trussMat);
        trussR.position.set(2.2, 5.2, 0);
        arenaGroup.add(trussL, trussR);


        const lightBoxGeo = new THREE.BoxGeometry(0.40, 0.12, 0.80);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfff0dd,
            emissiveIntensity: 0.9,
            roughness: 0.1
        });
        [-2.0, 0, 2.0].forEach(z => {
            const lightL = new THREE.Mesh(lightBoxGeo, lightMat);
            lightL.position.set(-2.2, 5.14, z);
            const lightR = new THREE.Mesh(lightBoxGeo, lightMat);
            lightR.position.set(2.2, 5.14, z);
            arenaGroup.add(lightL, lightR);
        });

        this.scene.add(arenaGroup);
    }

    buildTable() {
        const tableGroup = new THREE.Group();


        const topGeo = new THREE.BoxGeometry(1.525, 0.05, 2.74);
        const tableTex = this.createTableTexture();
        const topMat = new THREE.MeshStandardMaterial({
            map: tableTex,
            roughness: 0.34,
            metalness: 0.06
        });
        const sideMat = new THREE.MeshStandardMaterial({
            color: 0x0c3b60,
            roughness: 0.45,
            metalness: 0.1
        });
        const topMats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
        const tableTop = new THREE.Mesh(topGeo, topMats);
        tableTop.position.y = 0.76 - 0.025;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        tableGroup.add(tableTop);


        const cornerGeo = new THREE.BoxGeometry(0.04, 0.052, 0.04);
        const cornerMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.2 });
        [
            [-1.525 / 2 + 0.015, -2.74 / 2 + 0.015],
            [ 1.525 / 2 - 0.015, -2.74 / 2 + 0.015],
            [-1.525 / 2 + 0.015,  2.74 / 2 - 0.015],
            [ 1.525 / 2 - 0.015,  2.74 / 2 - 0.015]
        ].forEach(([cx, cz]) => {
            const cap = new THREE.Mesh(cornerGeo, cornerMat);
            cap.position.set(cx, 0.76 - 0.025, cz);
            tableGroup.add(cap);
        });


        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x1a1c22,
            roughness: 0.35,
            metalness: 0.75
        });


        const legGeo = new THREE.BoxGeometry(0.065, 0.735, 0.065);
        const legPositions = [
            [-0.64, 0.735 / 2, -1.14],
            [ 0.64, 0.735 / 2, -1.14],
            [-0.64, 0.735 / 2,  1.14],
            [ 0.64, 0.735 / 2,  1.14]
        ];
        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, steelMat);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            tableGroup.add(leg);
        });


        const centerBeamGeo = new THREE.BoxGeometry(1.24, 0.06, 0.06);
        const centerBeam = new THREE.Mesh(centerBeamGeo, steelMat);
        centerBeam.position.set(0, 0.20, 0);
        tableGroup.add(centerBeam);

        const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.5, roughness: 0.3 });
        [-0.50, 0.50].forEach(wx => {
            const wheel = new THREE.Mesh(wheelGeo, [rimMat, wheelMat, wheelMat]);
            wheel.position.set(wx, 0.045, 0);
            wheel.castShadow = true;
            tableGroup.add(wheel);
        });


        const braceGeo = new THREE.BoxGeometry(0.03, 0.60, 0.03);
        const b1 = new THREE.Mesh(braceGeo, steelMat);
        b1.position.set(-0.64, 0.45, -0.60);
        b1.rotation.x = -0.55;
        const b2 = new THREE.Mesh(braceGeo, steelMat);
        b2.position.set(0.64, 0.45, -0.60);
        b2.rotation.x = -0.55;
        const b3 = new THREE.Mesh(braceGeo, steelMat);
        b3.position.set(-0.64, 0.45, 0.60);
        b3.rotation.x = 0.55;
        const b4 = new THREE.Mesh(braceGeo, steelMat);
        b4.position.set(0.64, 0.45, 0.60);
        b4.rotation.x = 0.55;
        tableGroup.add(b1, b2, b3, b4);


        const netW = 1.525 + 0.305;
        const netH = 0.1525;
        const netGeo = new THREE.PlaneGeometry(netW, netH);
        const netTex = this.createNetTexture();
        const netMat = new THREE.MeshStandardMaterial({
            map: netTex,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            roughness: 0.35
        });
        this.netMesh = new THREE.Mesh(netGeo, netMat);
        this.netMesh.position.set(0, 0.76 + netH / 2, 0);
        this.netMesh.castShadow = true;
        tableGroup.add(this.netMesh);


        const postGeo = new THREE.CylinderGeometry(0.016, 0.016, netH + 0.04, 16);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x24272e, metalness: 0.85, roughness: 0.25 });
        const postL = new THREE.Mesh(postGeo, postMat);
        postL.position.set(-netW / 2, 0.76 + netH / 2, 0);
        const postR = new THREE.Mesh(postGeo, postMat);
        postR.position.set(netW / 2, 0.76 + netH / 2, 0);
        tableGroup.add(postL, postR);


        const knobGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
        const knobL = new THREE.Mesh(knobGeo, knobMat);
        knobL.position.set(-netW / 2, 0.76 + netH + 0.02, 0);
        const knobR = new THREE.Mesh(knobGeo, knobMat);
        knobR.position.set(netW / 2, 0.76 + netH + 0.02, 0);
        tableGroup.add(knobL, knobR);

        this.tableMesh = tableGroup;
        this.scene.add(tableGroup);
    }

    createPaddle(rubberColor, handleWoodColor) {
        const paddleGroup = new THREE.Group();


        const bladeGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.014, 36);
        bladeGeo.scale(1.0, 1.0, 1.14);


        const edgeTapeTex = this.createPaddleEdgeTapeTexture();
        const edgeTapeMat = new THREE.MeshStandardMaterial({
            map: edgeTapeTex,
            roughness: 0.6,
            metalness: 0.1
        });

        const frontRubberMat = new THREE.MeshStandardMaterial({
            color: rubberColor,
            roughness: 0.28,
            metalness: 0.06
        });

        const backRubberMat = new THREE.MeshStandardMaterial({
            color: 0x141414,
            roughness: 0.32,
            metalness: 0.06
        });

        const bladeMats = [edgeTapeMat, frontRubberMat, backRubberMat];
        const blade = new THREE.Mesh(bladeGeo, bladeMats);
        blade.rotation.x = Math.PI / 2;
        blade.castShadow = true;
        paddleGroup.add(blade);


        const handleGeo = new THREE.BoxGeometry(0.028, 0.105, 0.024);
        const handleMat = new THREE.MeshStandardMaterial({
            color: handleWoodColor,
            roughness: 0.42,
            metalness: 0.08
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0, -0.132, 0);
        handle.castShadow = true;
        paddleGroup.add(handle);


        const stripeGeo = new THREE.BoxGeometry(0.012, 0.09, 0.026);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x5a2d12, roughness: 0.5 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, -0.132, 0);
        paddleGroup.add(stripe);


        const gripGeo = new THREE.CylinderGeometry(0.016, 0.020, 0.105, 16);
        gripGeo.scale(1.0, 1.0, 0.72);
        const grip = new THREE.Mesh(gripGeo, handleMat);
        grip.position.set(0, -0.132, 0);
        paddleGroup.add(grip);


        const lensGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.028, 16);
        lensGeo.rotateZ(Math.PI / 2);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.1 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, -0.175, 0);
        paddleGroup.add(lens);

        return paddleGroup;
    }

    buildPaddles() {

        this.playerPaddle = this.createPaddle(0xd3222a, 0xcda06e);
        this.playerPaddle.position.set(0, 0.96, 1.55);
        this.scene.add(this.playerPaddle);


        this.opponentPaddle = this.createPaddle(0xe02476, 0xcda06e);
        this.opponentPaddle.position.set(0, 1.05, -1.65);
        this.scene.add(this.opponentPaddle);
    }

    buildBall() {

        const ballGeo = new THREE.SphereGeometry(0.02, 32, 32);


        const ballMat = new THREE.MeshStandardMaterial({
            color: 0xfffdf0,
            roughness: 0.20,
            metalness: 0.04
        });
        this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
        this.ballMesh.castShadow = true;
        this.ballMesh.position.set(0, 0.95, 1.0);
        this.scene.add(this.ballMesh);


        const shadowGeo = new THREE.PlaneGeometry(0.08, 0.08);
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 64;
        shadowCanvas.height = 64;
        const sCtx = shadowCanvas.getContext('2d');
        const radGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 31);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.70)');
        radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = radGrad;
        sCtx.fillRect(0, 0, 64, 64);

        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            opacity: 0.65,
            depthWrite: false
        });
        this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.ballShadow.rotation.x = -Math.PI / 2;
        this.ballShadow.position.set(0, 0.761, 0);
        this.scene.add(this.ballShadow);


        for (let i = 0; i < this.maxTrailPoints; i++) {
            const trailGeo = new THREE.SphereGeometry(0.016 * (1 - i / this.maxTrailPoints), 12, 12);
            const trailMat = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0
            });
            const trailMesh = new THREE.Mesh(trailGeo, trailMat);
            this.scene.add(trailMesh);
            this.speedTrail.push(trailMesh);
        }
    }


    buildArcadeServeTargets() {
        const group = new THREE.Group();
        group.visible = false;




        const zoneDefs = [
            { id: 'deep-left', x: -0.32, z: -1.04 },
            { id: 'deep-right', x: 0.32, z: -1.04 }
        ];

        const zoneGeo = new THREE.PlaneGeometry(0.58, 0.42);
        zoneDefs.forEach(def => {
            const material = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0.075,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(zoneGeo, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(def.x, 0.764, def.z);
            mesh.userData.zoneId = def.id;
            group.add(mesh);
            this.arcadeServeZones.push(mesh);
        });

        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffc83b,
            transparent: true,
            opacity: 0.92,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.arcadeServeAimMarker = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.105, 36), ringMat);
        this.arcadeServeAimMarker.rotation.x = -Math.PI / 2;
        this.arcadeServeAimMarker.position.set(0, 0.768, -0.92);
        group.add(this.arcadeServeAimMarker);

        this.arcadeServeTargetGroup = group;
        this.scene.add(group);
    }

    setArcadeServeAim(targetX = 0, targetZ = -0.92, visible = false, zoneId = '', perfect = false, mode = 'arcade') {
        if (!this.arcadeServeTargetGroup) return;
        this.arcadeServeTargetGroup.visible = !!visible;
        if (!visible) return;

        const isPro = mode === 'pro';
        if (this.arcadeServeAimMarker) {
            this.arcadeServeAimMarker.position.x = targetX;
            this.arcadeServeAimMarker.position.z = targetZ;
            this.arcadeServeAimMarker.material.opacity = perfect ? 1.0 : 0.88;
            this.arcadeServeAimMarker.material.color.setHex(isPro ? 0x00e5ff : 0xffc83b);
            const scale = perfect ? 1.16 : (isPro ? 0.94 : 1.0);
            this.arcadeServeAimMarker.scale.set(scale, scale, scale);
        }

        this.arcadeServeZones.forEach(zone => {
            const active = zone.userData.zoneId === zoneId;
            zone.material.color.setHex(isPro ? 0x00e5ff : 0x00e5ff);
            zone.material.opacity = active ? (isPro ? 0.15 : (perfect ? 0.28 : 0.18)) : (isPro ? 0.035 : 0.055);
        });
    }

    addBounceEffect(x, z) {
        let ring = this.bounceRingPool.pop();
        if (!ring) {
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide
            });
            ring = new THREE.Mesh(this.bounceRingGeometry, ringMat);
            ring.rotation.x = -Math.PI / 2;
        }

        ring.visible = true;
        ring.scale.set(1, 1, 1);
        ring.material.opacity = 0.85;
        ring.position.set(x, 0.762, z);
        this.scene.add(ring);
        this.bounceRings.push({ mesh: ring, age: 0 });
    }

    addSmashSparks(pos) {
        for (let i = 0; i < 20; i++) {
            const spark = this.sparkPool.pop() || new THREE.Mesh(this.sparkGeometry, this.sparkMaterial);
            spark.visible = true;
            spark.position.set(pos.x, pos.y, pos.z);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 3.6,
                Math.random() * 2.4 + 1.2,
                (Math.random() - 0.5) * 3.6
            );
            this.scene.add(spark);
            this.particles.push({ mesh: spark, vel: vel, age: 0 });
        }
    }

    update(dt, ballPos, playerPos, playerRot, opponentPos, opponentRot) {

        if (this.ballMesh && ballPos) {
            this.ballMesh.position.set(ballPos.x, ballPos.y, ballPos.z);


            if (this.ballShadow) {
                this.ballShadow.position.x = ballPos.x;
                this.ballShadow.position.z = ballPos.z;
                const heightAboveTable = Math.max(0.01, ballPos.y - 0.76);
                const scale = Math.min(2.8, 1.0 + heightAboveTable * 0.9);
                this.ballShadow.scale.set(scale, scale, scale);
                this.ballShadow.material.opacity = Math.max(0.05, 0.70 - heightAboveTable * 0.55);

                const onTable = Math.abs(ballPos.x) < 0.85 && Math.abs(ballPos.z) < 1.45;
                this.ballShadow.visible = onTable;
            }


            if (this.speedTrail.length > 0) {
                for (let i = this.speedTrail.length - 1; i > 0; i--) {
                    this.speedTrail[i].position.copy(this.speedTrail[i - 1].position);
                    this.speedTrail[i].material.opacity = this.speedTrail[i - 1].material.opacity * 0.78;
                }
                this.speedTrail[0].position.set(ballPos.x, ballPos.y, ballPos.z);
                this.speedTrail[0].material.opacity = 0.55;
            }
        }


        if (this.playerPaddle && playerPos) {
            this.playerPaddle.position.set(playerPos.x, playerPos.y, playerPos.z);
            if (playerRot) {
                this.playerPaddle.rotation.set(playerRot.x, playerRot.y, playerRot.z);
            }
        }


        if (this.opponentPaddle && opponentPos) {
            this.opponentPaddle.position.set(opponentPos.x, opponentPos.y, opponentPos.z);
            if (opponentRot) {
                this.opponentPaddle.rotation.set(opponentRot.x, opponentRot.y, opponentRot.z);
            }
        }


        if (this.arcadeServeTargetGroup && this.arcadeServeTargetGroup.visible && this.arcadeServeAimMarker) {
            const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.06;
            const base = this.arcadeServeAimMarker.material.opacity > 0.95 ? 1.14 : 1.0;
            this.arcadeServeAimMarker.scale.set(base * pulse, base * pulse, base * pulse);
        }


        for (let i = this.bounceRings.length - 1; i >= 0; i--) {
            const r = this.bounceRings[i];
            r.age += dt;
            r.mesh.scale.addScalar(dt * 3.8);
            r.mesh.material.opacity = Math.max(0, 0.85 - r.age * 2.6);
            if (r.age > 0.35) {
                this.scene.remove(r.mesh);
                r.mesh.visible = false;
                this.bounceRingPool.push(r.mesh);
                this.bounceRings.splice(i, 1);
            }
        }


        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;
            p.mesh.position.addScaledVector(p.vel, dt);
            p.vel.y -= 9.8 * dt;
            if (p.age > 0.42) {
                this.scene.remove(p.mesh);
                p.mesh.visible = false;
                this.sparkPool.push(p.mesh);
                this.particles.splice(i, 1);
            }
        }


        if (this.cameraShake > 0) {
            this.camera.position.x = this.cameraBasePos.x + (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y = this.cameraBasePos.y + (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake = Math.max(0, this.cameraShake - dt * 0.35);
        } else {
            this.camera.position.copy(this.cameraBasePos);
        }
        this.camera.lookAt(0, 0.75, -0.25);


        this.renderer.render(this.scene, this.camera);
    }

    shake(intensity = 0.045) {
        this.cameraShake = intensity;
    }


    renderOnly() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;

        this.updateCameraForAspect(aspect);
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (width < 900 && ('ontouchstart' in window));
        const maxPixelRatio = isMobile ? 1.5 : 2.0;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
        this.renderer.setSize(width, height);
    }
}

window.TableTennisRenderer = TableTennisRenderer;
