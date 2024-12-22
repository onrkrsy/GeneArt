class GeneArtVisualizer {
    constructor() {
        this.canvas = document.getElementById('artCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.geneSelect = document.getElementById('geneSelect');
        this.generateBtn = document.getElementById('generateBtn');
        this.geneInfo = document.getElementById('geneInfo');

        this.canvas.width = 800;
        this.canvas.height = 600;

        // Initialize all maps and caches first
        this.sequenceCache = new Map();
        this.colorCache = new Map();

        this.particles = [];
        this.connections = [];
        this.animationFrame = null;
        this.time = 0;

        // Initialize noise using global SimplexNoise
        this.noise = new SimplexNoise();
        this.noise3D = (x, y, z) => this.noise.noise3D(x, y, z);

        // Add event listeners
        this.generateBtn.addEventListener('click', () => {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
            this.generateArt();
        });

        this.geneSelect.addEventListener('change', () => {
            this.fetchGeneSequence(this.geneSelect.value);
        });

        // Setup visualization properties
        this.maxParticles = 300; // Sabit parçacık sayısı
        this.maxConnections = 200;
        this.lastFrameTime = 0;
        this.frameRate = 1000 / 30;

        // Flow field properties
        this.flowField = [];
        this.resolution = 20;
        this.cols = Math.floor(this.canvas.width / this.resolution);
        this.rows = Math.floor(this.canvas.height / this.resolution);
        this.noiseZ = 0;
        
        // Particle properties
        this.particleLife = 100;
        
        // Canvas rendering properties
        this.ctx.shadowBlur = 15;
        this.ctx.globalCompositeOperation = 'screen';

        // Initialize data and start
        this.initializeGeneData();
        this.fetchGeneSequence(this.geneSelect.value);

        // Performans için ayarlar
        this.maxParticles = 300; // Parçacık sayısını azalt
        this.frameRate = 1000 / 30; // 30 FPS
        
        // Hedef koordinatlar için ayarlar
        this.targetPositions = [];
        this.currentShape = 'helix'; // helix, circle, wave, dna
        this.transitionSpeed = 0.02; // Geçiş hızı

        document.getElementById('shapeSelect').addEventListener('change', (e) => {
            this.changeShape(e.target.value);
        });

        // Akış kontrolü için yeni parametreler
        this.flowSpeed = 0.5;
        this.noiseScale = 0.003;
        this.timeScale = 0.001;
        this.particleSpeed = 2;
        this.trailLength = 0.15; // İz uzunluğu

        // Renk geçişleri için
        this.baseColors = {
            A: { r: 30, g: 77, b: 140 },   // Koyu mavi
            T: { r: 219, g: 166, b: 50 },  // Altın sarısı
            G: { r: 46, g: 93, b: 59 },    // Koyu yeşil
            C: { r: 139, g: 69, b: 19 }    // Kahverengi
        };
    }

    async fetchGeneSequence(ensemblId) {
        if (this.sequenceCache.has(ensemblId)) {
            const cachedData = this.sequenceCache.get(ensemblId);
            this.updateGeneData(ensemblId, cachedData.seq);
            this.geneInfo.textContent = `Loaded sequence for ${cachedData.desc}`;
            this.generateArt();
            return;
        }

        try {
            this.geneInfo.textContent = 'Loading gene sequence...';
            const response = await fetch(`https://rest.ensembl.org/sequence/id/${ensemblId}?content-type=application/json`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch gene sequence');
            }

            const data = await response.json();
            this.updateGeneData(ensemblId, data.seq);
            this.geneInfo.textContent = `Loaded sequence for ${data.desc}`;
            this.generateArt();
            this.sequenceCache.set(ensemblId, data);
        } catch (error) {
            console.error('Error fetching gene sequence:', error);
            this.geneInfo.textContent = 'Error loading gene sequence';
        }
    }

    updateGeneData(ensemblId, sequence) {
        // Analyze sequence for color mapping
        const baseFrequency = this.analyzeSequence(sequence);
        const colors = this.generateColorPalette(baseFrequency);

        this.geneData[ensemblId] = {
            sequence: sequence,
            info: `Gene ${ensemblId}`,
            colors: colors,
            complexity: 0.8,
            density: 200,
            rules: {
                connectionRadius: 100,
                mutationRate: 0.05,
                flowSpeed: 2,
                noiseScale: 0.003,
                particleSpeed: 2
            }
        };
    }

    analyzeSequence(sequence) {
        const bases = { A: 0, T: 0, G: 0, C: 0 };
        for (let base of sequence) {
            if (bases.hasOwnProperty(base)) {
                bases[base]++;
            }
        }
        const total = sequence.length;
        return {
            A: bases.A / total,
            T: bases.T / total,
            G: bases.G / total,
            C: bases.C / total
        };
    }

    generateColorPalette(frequency) {
        // Van Gogh'un Yıldızlı Gece renk paleti
        const vanGoghColors = {
            A: {
                primary: '#1E4D8C',  // Koyu mavi
                secondary: '#4A73A2' // Açık mavi
            },
            T: {
                primary: '#DBA632',  // Altın sarısı
                secondary: '#F2CE68' // Açık sarı
            },
            G: {
                primary: '#2E5D3B',  // Koyu yeşil
                secondary: '#78A58D' // Açık yeşil
            },
            C: {
                primary: '#8B4513',  // Kahverengi
                secondary: '#A0522D' // Açık kahve
            }
        };

        return {
            A: vanGoghColors.A,
            T: vanGoghColors.T,
            G: vanGoghColors.G,
            C: vanGoghColors.C
        };
    }

    updateFlowField() {
        this.flowField = [];
        const scale = 0.005; // Daha büyük girdaplar için
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // Van Gogh tarzı girdap efekti
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const dx = x * this.resolution - centerX;
                const dy = y * this.resolution - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const baseAngle = Math.atan2(dy, dx);
                const noise = this.noise3D(
                    x * scale,
                    y * scale,
                    this.noiseZ
                );
                
                // Girdap efekti ve noise kombinasyonu
                const angle = baseAngle + 
                    (noise * Math.PI * 2) + 
                    (Math.sin(distance * 0.01) * Math.PI);
                
                this.flowField.push(angle);
            }
        }
        this.noiseZ += 0.001;
    }

    initializeGeneData() {
        // Define default visual settings for different genes
        this.geneData = {
            'ENSG00000012048': {  // BRCA1
                info: 'BRCA1 - Breast Cancer Gene',
                colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
                complexity: 0.8,
                density: 50,
                rules: {
                    connectionRadius: 80,
                    mutationRate: 0.02,
                    symmetry: true
                }
            },
            // Add more genes as needed
        };
    }

    generateArt() {
        const selectedGene = this.geneSelect.value;
        const geneInfo = this.geneData[selectedGene];
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.geneInfo.textContent = geneInfo.info;
        
        this.initializeParticles(geneInfo);
        this.animate();
    }

    initializeParticles(geneInfo) {
        this.particles = [];
        const sequence = geneInfo.sequence;
        
        for (let i = 0; i < this.maxParticles; i++) {
            const nucleotide = sequence[i % sequence.length];
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                size: Math.random() * 2 + 2,
                type: nucleotide
            });
        }
    }

    animate(currentTime) {
        if (currentTime - this.lastFrameTime < this.frameRate) {
            this.animationFrame = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        this.lastFrameTime = currentTime;

        // Arka planı temizleme işlemini kaldırdık
        this.time += 1;
        this.updateAndDrawParticles();

        this.animationFrame = requestAnimationFrame((time) => this.animate(time));
    }

    updateAndDrawParticles() {
        const time = this.time * this.timeScale;
        
        this.particles.forEach(particle => {
            // Perlin noise ile akış alanı oluştur
            const noiseX = particle.x * this.noiseScale;
            const noiseY = particle.y * this.noiseScale;
            
            // Çoklu oktav noise için farklı ölçekler
            const noise1 = this.noise3D(noiseX, noiseY, time);
            const noise2 = this.noise3D(noiseX * 2, noiseY * 2, time * 1.5) * 0.5;
            const noise3 = this.noise3D(noiseX * 4, noiseY * 4, time * 2) * 0.25;
            
            const noiseValue = (noise1 + noise2 + noise3);

            // Akış yönünü hesapla
            const angle = noiseValue * Math.PI * 2;
            
            // Parçacık hızını güncelle
            particle.vx += Math.cos(angle) * this.flowSpeed;
            particle.vy += Math.sin(angle) * this.flowSpeed;
            
            // Hız sınırlaması
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > this.particleSpeed) {
                particle.vx = (particle.vx / speed) * this.particleSpeed;
                particle.vy = (particle.vy / speed) * this.particleSpeed;
            }
            
            // Sürtünme
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Pozisyonu güncelle
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Sınırları kontrol et
            this.handleBoundaries(particle);

            // Parçacığı çiz
            this.drawParticle(particle);
        });
    }

    drawParticle(particle) {
        const color = this.baseColors[particle.type];
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const size = particle.size * (1 + speed * 0.2);

        // Renk döngüsü için zaman bazlı değişim
        const hueShift = (this.time * 0.5) % 360; // Renk tonu değişimi
        const r = color.r + Math.sin(hueShift * 0.017) * 30;
        const g = color.g + Math.sin((hueShift + 120) * 0.017) * 30;
        const b = color.b + Math.sin((hueShift + 240) * 0.017) * 30;

        // Renkleri sınırla
        const finalR = Math.min(255, Math.max(0, Math.floor(r)));
        const finalG = Math.min(255, Math.max(0, Math.floor(g)));
        const finalB = Math.min(255, Math.max(0, Math.floor(b)));

        // Glow efekti
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `rgba(${finalR}, ${finalG}, ${finalB}, 0.5)`;

        // Gradient oluştur
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, size * 2
        );

        gradient.addColorStop(0, `rgba(${finalR}, ${finalG}, ${finalB}, 0.8)`);
        gradient.addColorStop(1, `rgba(${finalR}, ${finalG}, ${finalB}, 0)`);

        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // İz efekti
        if (speed > 0.5) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${finalR}, ${finalG}, ${finalB}, 0.2)`;
            this.ctx.lineWidth = size * 0.5;
            this.ctx.moveTo(particle.x - particle.vx * 3, particle.y - particle.vy * 3);
            this.ctx.lineTo(particle.x, particle.y);
            this.ctx.stroke();
        }
    }

    handleBoundaries(particle) {
        // Yumuşak sınır geçişleri
        const margin = 50;
        const bounce = 0.5;

        if (particle.x < margin) {
            particle.vx += (margin - particle.x) * 0.05;
        }
        if (particle.x > this.canvas.width - margin) {
            particle.vx -= (particle.x - (this.canvas.width - margin)) * 0.05;
        }
        if (particle.y < margin) {
            particle.vy += (margin - particle.y) * 0.05;
        }
        if (particle.y > this.canvas.height - margin) {
            particle.vy -= (particle.y - (this.canvas.height - margin)) * 0.05;
        }

        // Ekran dışına çıkanları karşı tarafa taşı
        if (particle.x < -margin) particle.x = this.canvas.width + margin;
        if (particle.x > this.canvas.width + margin) particle.x = -margin;
        if (particle.y < -margin) particle.y = this.canvas.height + margin;
        if (particle.y > this.canvas.height + margin) particle.y = -margin;
    }

    updateConnections(rules) {
        this.connections = [];
        let connectionCount = 0;
        
        for (let i = 0; i < this.particles.length && connectionCount < this.maxConnections; i++) {
            const p1 = this.particles[i];
            for (let j = i + 1; j < this.particles.length && connectionCount < this.maxConnections; j++) {
                const p2 = this.particles[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < rules.connectionRadius) {
                    this.connections.push({
                        p1, p2,
                        strength: 1 - (distance / rules.connectionRadius)
                    });
                    connectionCount++;
                }
            }
        }
    }

    drawConnections() {
        this.connections.forEach(conn => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${this.getColorComponents(conn.p1.color)}, ${conn.strength * 0.5})`;
            this.ctx.lineWidth = conn.strength * 2;
            this.ctx.moveTo(conn.p1.x, conn.p1.y);
            this.ctx.lineTo(conn.p2.x, conn.p2.y);
            this.ctx.stroke();
        });
    }

    getColorComponents(color) {
        if (!this.colorCache) this.colorCache = new Map();
        if (this.colorCache.has(color)) {
            return this.colorCache.get(color);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const result = `${data[0]}, ${data[1]}, ${data[2]}`;
        this.colorCache.set(color, result);
        return result;
    }

    updateParticle(particle, rules) {
        switch(rules.pattern) {
            case 'helix':
                this.applyHelixMovement(particle);
                break;
            case 'network':
                this.applyNetworkMovement(particle);
                break;
        }

        if (Math.random() < rules.mutationRate) {
            particle.angle += (Math.random() - 0.5) * 0.5;
        }

        this.constrainParticle(particle);
    }

    applyHelixMovement(particle) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 150;
        
        particle.x = centerX + Math.cos(particle.angle + this.time) * radius;
        particle.y = centerY + Math.sin(particle.angle + this.time) * radius * 0.5;
        particle.angle += particle.speed * 0.01;
    }

    applyNetworkMovement(particle) {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        
        particle.angle += Math.sin(this.time * particle.speed) * 0.1;
    }

    constrainParticle(particle) {
        const margin = 50;
        if (particle.x < margin) particle.x = margin;
        if (particle.x > this.canvas.width - margin) particle.x = this.canvas.width - margin;
        if (particle.y < margin) particle.y = margin;
        if (particle.y > this.canvas.height - margin) particle.y = this.canvas.height - margin;
    }

    drawComplexShape(particle, sides) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(this.time * particle.speed * 0.5);

        this.ctx.beginPath();
        this.ctx.fillStyle = particle.color;
        
        const radius = particle.size * (1 + Math.sin(this.time) * 0.1);
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();

        if (particle.size > 10) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    generateTargetPositions() {
        this.targetPositions = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        switch(this.currentShape) {
            case 'helix':
                // DNA sarmalı şekli
                for(let i = 0; i < this.maxParticles; i++) {
                    const angle = (i / this.maxParticles) * Math.PI * 8;
                    const y = (i / this.maxParticles) * this.canvas.height;
                    const x = centerX + Math.sin(angle) * 100;
                    this.targetPositions.push({
                        x: x,
                        y: y
                    });
                }
                break;

            case 'circle':
                // Dairesel düzen
                for(let i = 0; i < this.maxParticles; i++) {
                    const angle = (i / this.maxParticles) * Math.PI * 2;
                    const radius = 150 + Math.sin(i * 0.1) * 50;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    this.targetPositions.push({x, y});
                }
                break;

            case 'wave':
                // Dalga şekli
                for(let i = 0; i < this.maxParticles; i++) {
                    const x = (i / this.maxParticles) * this.canvas.width;
                    const y = centerY + Math.sin(x * 0.02) * 100;
                    this.targetPositions.push({x, y});
                }
                break;
        }
    }

    // Şekil değiştirme fonksiyonu
    changeShape(newShape) {
        this.currentShape = newShape;
        this.generateTargetPositions();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new GeneArtVisualizer();
}); 