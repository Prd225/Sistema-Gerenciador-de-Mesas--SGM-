const $ = (id) => document.getElementById(id);
        const generateId = () => window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
        
        const SYSTEM_CONDITIONS = [
            { name: 'Abalado', desc: 'O personagem sofre –1d20 em testes. Se ficar abalado novamente, em vez disso fica apavorado. Condição de medo.', color: 'purple' },
            { name: 'Agarrado', desc: 'O personagem fica desprevenido e imóvel, sofre –1d20 em testes de ataque e só pode atacar com armas leves. Um personagem fazendo um ataque à distância contra um alvo envolvido na manobra agarrar tem 50% de chance de acertar o alvo errado. Condição de paralisia.', color: 'red' },
            { name: 'Alquebrado', desc: 'O custo em pontos de esforço das habilidades e dos rituais do personagem aumenta em +1. Condição mental.', color: 'purple' },
            { name: 'Apavorado', desc: 'O personagem sofre –2d20 em testes de perícia e deve fugir da fonte do medo da maneira mais eficiente possível. Condição de medo.', color: 'purple' },
            { name: 'Asfixiado', desc: 'O personagem não pode respirar. Um personagem asfixiado pode prender seu fôlego por um total de rodadas igual ao seu Vigor e, a cada vez que sofre dano enquanto está nesta condição, reduz este valor em 1. Ao final de seu turno na última dessas rodadas, o personagem fica morrendo.', color: 'yellow' },
            { name: 'Atordoado', desc: 'O personagem fica desprevenido e não pode fazer ações. Condição mental.', color: 'yellow' },
            { name: 'Caído', desc: 'Deitado no chão. O personagem sofre –2d20 em ataques corpo a corpo e seu deslocamento é reduzido a 1,5m. Além disso, sofre –5 na Defesa contra ataques corpo a corpo, mas recebe +5 na Defesa contra ataques à distância.', color: 'yellow' },
            { name: 'Cego', desc: 'O personagem fica desprevenido e lento, não pode fazer testes de Percepção para observar e sofre –2d20 em testes de perícias baseadas em Agilidade ou Força. Todos os alvos de seus ataques recebem camuflagem total. Condição de sentidos.', color: 'yellow' },
            { name: 'Confuso', desc: 'O personagem comporta-se de modo aleatório. Role 1d6 no início de seus turnos: 1) Movimenta-se em direção aleatória; 2-3) Não pode fazer ações; 4-5) Ataca o ser mais próximo; 6) Age normalmente. Condição mental.', color: 'purple' },
            { name: 'Debilitado', desc: 'O personagem sofre –2d20 em testes de Agilidade, Força e Vigor. Se o personagem ficar debilitado novamente, em vez disso fica inconsciente.', color: 'red' },
            { name: 'Desprevenido', desc: 'Despreparado para reagir. O personagem sofre –5 na Defesa e –1d20 Reflexos. Você fica desprevenido contra inimigos que não possa perceber.', color: 'yellow' },
            { name: 'Doente', desc: 'Sob efeito de uma doença.', color: 'green' },
            { name: 'Em Chamas', desc: 'O personagem está pegando fogo. No início de seus turnos, sofre 1d6 pontos de dano de fogo. O personagem pode gastar uma ação padrão para apagar o fogo com as mãos.', color: 'red' },
            { name: 'Enjoado', desc: 'O personagem só pode realizar uma ação padrão ou de movimento (não ambas) por rodada.', color: 'green' },
            { name: 'Enredado', desc: 'O personagem fica lento, vulnerável e sofre –1d20 em testes de ataque. Condição de paralisia.', color: 'yellow' },
            { name: 'Envenenado', desc: 'O efeito desta condição varia de acordo com o veneno. Pode ser outra condição ou dano recorrente.', color: 'green' },
            { name: 'Esmorecido', desc: 'O personagem sofre –2d20 em testes de Intelecto e Presença. Condição mental.', color: 'purple' },
            { name: 'Exausto', desc: 'O personagem fica debilitado, lento e vulnerável. Se ficar exausto novamente, em vez disso fica inconsciente. Condição de fadiga.', color: 'red' },
            { name: 'Fascinado', desc: 'Com a atenção presa em alguma coisa. O personagem sofre –2d20 em Percepção e não pode fazer ações, exceto observar aquilo que o fascinou. Condição mental.', color: 'purple' },
            { name: 'Fatigado', desc: 'O personagem fica fraco e vulnerável. Se o personagem ficar fatigado novamente, em vez disso fica exausto. Condição de fadiga.', color: 'red' },
            { name: 'Fraco', desc: 'O personagem sofre –1d20 em testes de Agilidade, Físico e Vigor. Se ficar fraco novamente, em vez disso fica debilitado.', color: 'red' },
            { name: 'Frustrado', desc: 'O personagem sofre –1d20 em testes de Intelecto e Presença. Se ficar frustrado novamente, em vez disso fica esmorecido. Condição mental.', color: 'purple' },
            { name: 'Imóvel', desc: 'Todas as formas de deslocamento do personagem são reduzidas a 0m. Condição de paralisia.', color: 'yellow' },
            { name: 'Inconsciente', desc: 'O personagem fica indefeso e não pode fazer ações, incluindo reações.', color: 'red' },
            { name: 'Indefeso', desc: 'O personagem é considerado desprevenido, mas sofre –10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.', color: 'red' },
            { name: 'Lento', desc: 'Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo) e não pode correr ou fazer investidas. Condição de paralisia.', color: 'yellow' },
            { name: 'Machucado', desc: 'O personagem tem menos da metade de seus pontos de vida totais.', color: 'red' },
            { name: 'Morrendo', desc: 'Com 0 pontos de vida. Fica inconsciente e morre após três rodadas se não estabilizar.', color: 'red' },
            { name: 'Ofuscado', desc: 'O personagem sofre –1d20 em testes de ataque e de Percepção. Condição de sentidos.', color: 'yellow' },
            { name: 'Paralisado', desc: 'O personagem fica imóvel e indefeso e só pode realizar ações puramente mentais. Condição de paralisia.', color: 'red' },
            { name: 'Pasmo', desc: 'O personagem não pode fazer ações. Condição mental.', color: 'purple' },
            { name: 'Petrificado', desc: 'O personagem fica inconsciente e recebe resistência a dano 10.', color: 'yellow' },
            { name: 'Sangrando', desc: 'Com um ferimento aberto. No início de seus turnos, o personagem deve fazer um teste de Vigor (DT 20) ou perde 1d6 PV.', color: 'red' },
            { name: 'Surdo', desc: 'O personagem não pode ouvir, sofre –2d20 em Iniciativa e ruim p/ rituais. Condição de sentidos.', color: 'yellow' },
            { name: 'Surpreendido', desc: 'Não ciente de seus inimigos. O personagem fica desprevenido e não pode fazer ações.', color: 'yellow' },
            { name: 'Vulnerável', desc: 'O personagem sofre –5 na Defesa.', color: 'yellow' }
        ];
        
        const DAMAGE_TYPES = ['Balístico', 'Impacto', 'Perfuração', 'Corte', 'Eletricidade', 'Fogo', 'Frio', 'Mental', 'Químico', 'Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'];
        const ACTION_TYPES = ['Padrão', 'Movimento', 'Reação', 'Ação Livre', 'Completa'];

        let AppState = { zones: {}, markers: {}, tokens: [], bgImages: [], scene: 1, round: 1, turn: 1, urgency: null, selectedZoneId: null, editingZone: false, editingMarkers: false, initiative: [], savedZoneEvents: [], savedTokenConditions: [] };

        // Ordem play Alarm Beep logic
        function playAlarmBeep() {
            let count = 0;
            const interval = setInterval(() => {
                if (count >= 3) {
                    clearInterval(interval);
                    return;
                }
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } catch(e) { console.log("Áudio não suportado ou bloqueado pelo navegador."); }
                count++;
            }, 600); // 600ms gap between beeps
        }

        const timerSystem = {
            interval: null,
            totalSeconds: 0,
            isRunning: false,
            
            updateDisplay() {
                if (this.totalSeconds < 0) this.totalSeconds = 0;
                const m = Math.floor(this.totalSeconds / 60).toString().padStart(2, '0');
                const s = (this.totalSeconds % 60).toString().padStart(2, '0');
                $('timerDisplay').innerText = `${m}:${s}`;
                
                if(this.totalSeconds === 0 && this.isRunning) {
                    this.stop();
                    $('timerDisplay').classList.add('alarm-blink-text');
                    playAlarmBeep();
                    setTimeout(() => $('timerDisplay').classList.remove('alarm-blink-text'), 3000);
                }
            },
            togglePlay() {
                const btn = $('timerPlayBtn');
                if(this.isRunning) {
                    clearInterval(this.interval);
                    this.isRunning = false;
                    btn.innerHTML = '<i class="fas fa-play"></i>';
                } else {
                    if(this.totalSeconds <= 0) return;
                    this.isRunning = true;
                    btn.innerHTML = '<i class="fas fa-pause"></i>';
                    this.interval = setInterval(() => {
                        this.totalSeconds--;
                        this.updateDisplay();
                    }, 1000);
                }
            },
            stop() {
                clearInterval(this.interval);
                this.isRunning = false;
                $('timerPlayBtn').innerHTML = '<i class="fas fa-play"></i>';
            },
            setTimer(minutes) {
                this.stop();
                this.totalSeconds = minutes * 60;
                $('timerDisplay').classList.remove('alarm-blink-text');
                this.updateDisplay();
            },
            promptManual() {
                const min = prompt("Digite os minutos:");
                if(min !== null && !isNaN(min)) {
                    this.setTimer(parseInt(min));
                }
            },
            toggleMinimize(e) {
                if(e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                $('realTimerBox').classList.toggle('minimized');
            }
        };

        const urgencySystem = {
            updateUI() {
                const valEl = $('valUrgency');
                if (AppState.urgency === null) {
                    valEl.innerText = "---";
                } else {
                    valEl.innerText = AppState.urgency;
                    if (AppState.urgency === 0) {
                        $('footerBar').classList.add('alarm-blink');
                        playAlarmBeep();
                        setTimeout(() => $('footerBar').classList.remove('alarm-blink'), 2000);
                        AppState.urgency = null; 
                        setTimeout(() => this.updateUI(), 2000);
                    }
                }
            },
            set(rounds) {
                AppState.urgency = rounds;
                this.updateUI();
            },
            change(amount) {
                if(AppState.urgency !== null) {
                    AppState.urgency += amount;
                    if(AppState.urgency < 0) AppState.urgency = 0;
                    this.updateUI();
                }
            },
            tickRound() {
                if(AppState.urgency !== null && AppState.urgency > 0) {
                    AppState.urgency--;
                    this.updateUI();
                }
            }
        };

        const tutorialSystem = {
            currentStep: 0, maxSteps: 6,
            init() { 
                const indicators = $('tutorialSteps'); 
                indicators.innerHTML = ''; 
                for(let i=0; i<this.maxSteps; i++) { 
                    const dot = document.createElement('div'); 
                    dot.className = `step-dot ${i === 0 ? 'active' : ''}`; 
                    indicators.appendChild(dot); 
                } 
                if(!localStorage.getItem('gmToolTutorialSeen')) { 
                    this.open(); 
                } 
            },
            open() { 
                $('tutorialModal').style.display = 'flex'; 
                this.currentStep = 0; 
                if (document.querySelectorAll('.step-dot').length === 0) this.init();
                this.updateUI(); 
            },
            close() { 
                $('tutorialModal').style.display = 'none'; 
                localStorage.setItem('gmToolTutorialSeen', 'true'); 
            },
            next() { 
                if(this.currentStep < this.maxSteps - 1) { 
                    this.currentStep++; 
                    this.updateUI(); 
                } else { 
                    this.close(); 
                } 
            },
            prev() { 
                if(this.currentStep > 0) { 
                    this.currentStep--; 
                    this.updateUI(); 
                } 
            },
            updateUI() { 
                for(let i=0; i<this.maxSteps; i++) { 
                    const stepEl = $(`step-${i}`);
                    if (stepEl) stepEl.classList.remove('active'); 
                    const dotEl = document.querySelectorAll('.step-dot')[i];
                    if (dotEl) dotEl.classList.remove('active'); 
                } 
                const currentStepEl = $(`step-${this.currentStep}`);
                if (currentStepEl) currentStepEl.classList.add('active'); 
                const currentDotEl = document.querySelectorAll('.step-dot')[this.currentStep];
                if (currentDotEl) currentDotEl.classList.add('active'); 
                
                $('tutPrevBtn').style.visibility = this.currentStep === 0 ? 'hidden' : 'visible'; 
                $('tutNextBtn').innerText = this.currentStep === this.maxSteps - 1 ? 'Começar!' : 'Próximo'; 
            }
        };

        const persistenceSystem = {
            resetState() {
                $('bgLayer').innerHTML = ''; $('drawingSvg').innerHTML = ''; $('tokenRoster').innerHTML = ''; $('markerList').innerHTML = '';
                document.querySelectorAll('.zone').forEach(el => el.remove()); document.querySelectorAll('.token-map').forEach(el => el.remove()); document.querySelectorAll('.marker').forEach(el => el.remove());
                AppState = { zones: {}, markers: {}, tokens: [], bgImages: [], scene: 1, round: 1, turn: 1, urgency: null, selectedZoneId: null, editingZone: false, editingMarkers: false, initiative: [], savedZoneEvents: [], savedTokenConditions: [] };
                mapSystem.currentX = 0; mapSystem.currentY = 0; mapSystem.scale = 1;
                mapSystem.updateTransform(); timeSystem.updateUI(); urgencySystem.updateUI(); ui.updateZoneEditor(null); initSystem.render();
                timerSystem.stop(); timerSystem.totalSeconds = 0; timerSystem.updateDisplay();
            },
            newCanvas() { if(confirm("Deseja criar um novo Canvas? Isso apagará seu progresso atual.")) { this.resetState(); } },
            saveCanvas() {
                const exportData = { ...AppState, version: "6.6" };
                const dataStr = JSON.stringify(exportData);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = 'gm-dashboard-save-' + new Date().toISOString().slice(0,10) + '.json';
                const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', exportFileDefaultName); linkElement.click();
            },
            async saveCanvasAs() {
                const exportData = { ...AppState, version: "6.6" }; const dataStr = JSON.stringify(exportData, null, 2); 
                try {
                    if ('showSaveFilePicker' in window) {
                        const handle = await window.showSaveFilePicker({ suggestedName: 'gm-dashboard-save-' + new Date().toISOString().slice(0,10) + '.json', types: [{ description: 'JSON File', accept: {'application/json': ['.json']}, }], });
                        const writable = await handle.createWritable(); await writable.write(dataStr); await writable.close(); alert("Arquivo salvo com sucesso!");
                    } else { this.saveCanvas(); }
                } catch (err) { if (err.name !== 'AbortError') { console.error(err); alert("Erro ao salvar arquivo."); } }
            },
            hydrateState(loadedState) {
                this.resetState(); AppState = { ...AppState, ...loadedState }; 
                if(!AppState.initiative) AppState.initiative = []; if(!AppState.savedZoneEvents) AppState.savedZoneEvents = []; if(!AppState.savedTokenConditions) AppState.savedTokenConditions = []; if(AppState.urgency === undefined) AppState.urgency = null;
                if(AppState.bgImages) AppState.bgImages.forEach(img => bgManager.render(img));
                if(AppState.zones) Object.values(AppState.zones).forEach(zone => mapSystem.renderZone(zone));
                if(AppState.markers) Object.values(AppState.markers).forEach(marker => markerManager.renderMarkerOnMap(marker));
                markerManager.renderList(); tokenManager.renderRoster();
                if(AppState.tokens) AppState.tokens.forEach(t => { if(t.x !== null) tokenManager.placeTokenOnMap(t.id, t.x, t.y); });
                timeSystem.updateUI(); urgencySystem.updateUI(); initSystem.render(); ui.updatePresetSelect();
            },
            loadCanvas(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const loadedState = JSON.parse(event.target.result);
                        if (!loadedState.tokens || !loadedState.zones) throw new Error("Formato de arquivo inválido ou corrompido.");
                        this.hydrateState(loadedState); alert("Arquivo carregado com sucesso!");
                    } catch (e) { alert("Erro ao carregar arquivo: " + e.message); console.error(e); }
                }; reader.readAsText(file);
            }
        };

        $('loadFileInput').addEventListener('change', (e) => { const file = e.target.files[0]; if(file) persistenceSystem.loadCanvas(file); e.target.value = ''; });

        const initSystem = {
            openModal() {
                const list = $('initTokenList'); list.innerHTML = '';
                if(AppState.tokens.length === 0) { list.innerHTML = '<p style="color:var(--text-sec); text-align:center;">Crie tokens primeiro.</p>'; } else {
                    AppState.tokens.forEach(t => {
                        const currentInit = AppState.initiative.find(i => i.tokenId === t.id)?.value; const valStr = currentInit !== undefined ? currentInit.toFixed(2) : '';
                        const html = `<div class="form-group" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-dark); padding:5px 10px; border-radius:4px;"><div style="display:flex; align-items:center; gap:10px;"><div style="width:30px;height:30px;border-radius:50%;background:${t.colorFill};color:${t.colorText};border:2px solid ${t.colorBorder};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:bold;">${t.name}</div><span>${t.fullName}</span></div><input type="number" step="0.01" class="init-input" data-id="${t.id}" value="${valStr}" placeholder="00.00" style="width:80px; margin:0;"></div>`;
                        list.insertAdjacentHTML('beforeend', html);
                    });
                } $('initModal').style.display = 'flex';
            },
            closeModal() { $('initModal').style.display = 'none'; },
            save() {
                const inputs = document.querySelectorAll('.init-input'); let newInit = [];
                inputs.forEach(inp => { const val = parseFloat(inp.value); if(!isNaN(val)) { newInit.push({ tokenId: inp.dataset.id, value: val }); } });
                newInit.sort((a, b) => b.value - a.value); AppState.initiative = newInit;
                if(newInit.length > 0) { $('turnsPerRound').value = newInit.length; if(AppState.turn > newInit.length) AppState.turn = 1; }
                this.closeModal(); this.render(); timeSystem.updateUI();
            },
            clear() { if(confirm("Remover todos os personagens da Iniciativa?")) { AppState.initiative = []; this.render(); this.closeModal(); } },
            render() {
                const bar = $('initiativeBar'); bar.innerHTML = '';
                document.querySelectorAll('.token-map').forEach(el => el.classList.remove('active-turn'));
                if(!AppState.initiative || AppState.initiative.length === 0) return;
                const activeIndex = (AppState.turn - 1) % AppState.initiative.length;
                AppState.initiative.forEach((item, index) => {
                    const t = AppState.tokens.find(tok => tok.id === item.tokenId); if(!t) return;
                    const wrapper = document.createElement('div'); wrapper.className = 'init-token-wrapper';
                    const arrow = document.createElement('div'); arrow.className = 'init-arrow'; arrow.innerHTML = '<i class="fas fa-caret-down"></i>'; wrapper.appendChild(arrow);
                    const el = document.createElement('div'); el.className = `init-token ${index === activeIndex ? 'active' : ''}`; el.style.borderColor = t.colorBorder; el.style.backgroundColor = t.colorFill; el.style.color = t.colorText; el.innerText = t.name; el.title = t.fullName; el.onclick = () => tokenManager.centerOnToken(t.id); wrapper.appendChild(el);
                    const valEl = document.createElement('div'); valEl.className = 'init-value'; valEl.innerText = item.value.toFixed(2); wrapper.appendChild(valEl);
                    bar.appendChild(wrapper);
                    if (index === activeIndex) { const mapToken = $(`token-map-${t.id}`); if(mapToken) mapToken.classList.add('active-turn'); }
                });
            }
        };

        const bgManager = {
            add(file, x, y) { const reader = new FileReader(); reader.onload = (evt) => { const imgObj = { id: generateId(), src: evt.target.result, x: x || 0, y: y || 0, scale: 1, rotation: 0 }; AppState.bgImages.push(imgObj); this.render(imgObj); mapSystem.setTool('edit-bg'); }; reader.readAsDataURL(file); },
            render(imgData, updateOnly = false) { let el = $(`bg-${imgData.id}`); if (!el) { el = document.createElement('img'); el.src = imgData.src; el.className = 'bg-prop-image'; el.id = `bg-${imgData.id}`; el.ondragstart = (e) => e.preventDefault(); $('bgLayer').appendChild(el); } el.style.left = imgData.x + 'px'; el.style.top = imgData.y + 'px'; el.style.transform = `scale(${imgData.scale}) rotate(${imgData.rotation}deg)`; },
            delete(id) { const idx = AppState.bgImages.findIndex(i => i.id === id); if (idx > -1) { AppState.bgImages.splice(idx, 1); const el = $(`bg-${id}`); if(el) el.remove(); } }
        };

        const ui = {
            toggleSidebar: (side, forceState = null) => { const el = side === 'left' ? $('sidebarLeft') : $('sidebarRight'); const isOpen = el.classList.contains('open'); const shouldOpen = forceState !== null ? forceState : !isOpen; if (shouldOpen) el.classList.add('open'); else el.classList.remove('open'); },
            setEditMode: (isEdit) => { AppState.editingZone = isEdit; const btn = $('btnToggleEditZone'); btn.innerHTML = isEdit ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-lock"></i>'; btn.classList.toggle('active', isEdit); $('viewRead').style.display = isEdit ? 'none' : 'block'; $('viewEdit').style.display = isEdit ? 'block' : 'none'; if (AppState.selectedZoneId) ui.updateZoneEditor(AppState.selectedZoneId); },
            toggleEditMode: () => ui.setEditMode(!AppState.editingZone),
            toggleEditMarkerMode: () => { AppState.editingMarkers = !AppState.editingMarkers; const btn = $('btnToggleEditMarker'); const list = $('markerList'); if (AppState.editingMarkers) { btn.innerHTML = '<i class="fas fa-unlock"></i>'; btn.classList.add('active'); list.classList.remove('sidebar-disabled'); } else { btn.innerHTML = '<i class="fas fa-lock"></i>'; btn.classList.remove('active'); list.classList.add('sidebar-disabled'); } },
            changeVisits: (amount) => { if(!AppState.selectedZoneId) return; const zone = AppState.zones[AppState.selectedZoneId]; if(!zone.data.visits) zone.data.visits = 0; zone.data.visits += amount; if(zone.data.visits < 0) zone.data.visits = 0; $('readVisits').innerText = zone.data.visits; $('editVisits').innerText = zone.data.visits; },
            saveEventAsPreset: (idx) => { if(!AppState.selectedZoneId) return; const evt = AppState.zones[AppState.selectedZoneId].data.customEvents[idx]; if (!AppState.savedZoneEvents) AppState.savedZoneEvents = []; AppState.savedZoneEvents.push(JSON.parse(JSON.stringify(evt))); ui.updatePresetSelect(); alert("Evento salvo nas predefinições!"); },
            addPresetEvent: (presetIdx) => { if(!AppState.selectedZoneId || presetIdx === '') return; const preset = AppState.savedZoneEvents[presetIdx]; if(preset) { if (!AppState.zones[AppState.selectedZoneId].data.customEvents) AppState.zones[AppState.selectedZoneId].data.customEvents = []; AppState.zones[AppState.selectedZoneId].data.customEvents.push(JSON.parse(JSON.stringify(preset))); ui.updateZoneEditor(AppState.selectedZoneId); } },
            updatePresetSelect: () => { const select = $('presetEventSelect'); if(!select) return; select.innerHTML = '<option value="">Carregar Predefinição...</option>'; if(AppState.savedZoneEvents) { AppState.savedZoneEvents.forEach((evt, idx) => { select.insertAdjacentHTML('beforeend', `<option value="${idx}">${evt.name || 'Sem nome'}</option>`); }); } },
            clearPresets: () => { if(confirm("Deseja apagar todas as predefinições salvas da memória?")) { AppState.savedZoneEvents = []; ui.updatePresetSelect(); } },
            updateZoneEditor: (zoneId) => {
                const zone = AppState.zones[zoneId]; if (!zone) { $('zoneContent').style.display = 'none'; $('zoneEmptyState').style.display = 'block'; return; }
                $('zoneEmptyState').style.display = 'none'; $('zoneContent').style.display = 'block';
                if(!zone.data.visits) zone.data.visits = 0;
                $('readTitle').innerText = zone.data.title || 'Sem Título'; $('readDesc').innerText = zone.data.desc || 'Sem descrição.'; $('readVisits').innerText = zone.data.visits; $('editVisits').innerText = zone.data.visits;
                const poisContainer = $('readPois'); poisContainer.innerHTML = '';
                (zone.data.customPois || []).forEach(cat => { let iconClass = 'poi-none'; let iconHtml = ''; if(cat.icon === 'star') { iconClass = 'poi-star'; iconHtml = '<i class="fas fa-star"></i>'; } else if(cat.icon === 'spiral') { iconClass = 'poi-spiral'; iconHtml = '<i class="fas fa-dharmachakra"></i>'; } else if(cat.icon === 'triangle') { iconClass = 'poi-triangle'; iconHtml = '<i class="fas fa-caret-up"></i>'; } let html = `<div class="poi-block"><div class="poi-title ${iconClass}">${iconHtml} ${cat.title || 'Categoria'}</div>`; (cat.options || []).forEach(opt => { html += `<div class="poi-option"><span class="poi-opt-name">${opt.name}:</span> ${opt.desc}</div>`; }); html += `</div>`; poisContainer.insertAdjacentHTML('beforeend', html); });
                const eventsContainer = $('readEvents'); eventsContainer.innerHTML = '';
                (zone.data.customEvents || []).forEach(evt => { eventsContainer.insertAdjacentHTML('beforeend', `<div class="event-item event-${evt.color || 'red'}"><span class="event-name">${evt.name}</span><span style="font-size:0.9rem">${evt.desc}</span></div>`); });
                $('zoneTitle').value = zone.data.title || ''; $('zoneDesc').value = zone.data.desc || '';
                ui.renderPoiInputs(zone); ui.renderEventInputs(zone);
            },
            renderPoiInputs: (zone) => {
                const container = $('containerPois'); container.innerHTML = ''; if (!zone.data.customPois) zone.data.customPois = [];
                zone.data.customPois.forEach((cat, idx) => {
                    const card = document.createElement('div'); card.className = 'dynamic-card';
                    card.innerHTML = `<div class="dynamic-card-header"><div style="display:flex; align-items:center; gap:5px; flex-grow:1;"><select onchange="ui.updatePoiCat(${idx}, 'icon', this.value)" style="width:40px; padding:5px; background:transparent; border:none; color:var(--text-main);"><option value="none" ${cat.icon==='none'?'selected':''}>-</option><option value="star" ${cat.icon==='star'?'selected':''}>★</option><option value="spiral" ${cat.icon==='spiral'?'selected':''}>🌀</option><option value="triangle" ${cat.icon==='triangle'?'selected':''}>▲</option></select><input type="text" placeholder="Título" value="${cat.title}" oninput="ui.updatePoiCat(${idx}, 'title', this.value)" style="font-weight:bold; color:var(--accent-purple); width:100%;"></div><button class="btn-icon" style="color:var(--danger)" onclick="ui.removePoiCat(${idx})"><i class="fas fa-trash"></i></button></div><div id="poi-opts-${idx}"></div><button class="btn-outline" style="font-size:0.8rem; width:100%" onclick="ui.addPoiOption(${idx})">+ Opção</button>`;
                    container.appendChild(card); const optContainer = card.querySelector(`#poi-opts-${idx}`);
                    (cat.options || []).forEach((opt, optIdx) => { const optDiv = document.createElement('div'); optDiv.style.marginBottom = '10px'; optDiv.style.borderLeft = '2px solid #444'; optDiv.style.paddingLeft = '10px'; optDiv.innerHTML = `<div style="display:flex; gap:5px; margin-bottom:2px;"><input type="text" placeholder="Opção" value="${opt.name}" oninput="ui.updatePoiOpt(${idx}, ${optIdx}, 'name', this.value)"><button class="btn-icon" onclick="ui.removePoiOpt(${idx}, ${optIdx})"><i class="fas fa-times"></i></button></div><textarea placeholder="Descrição" oninput="ui.updatePoiOpt(${idx}, ${optIdx}, 'desc', this.value)" style="min-height:50px">${opt.desc}</textarea>`; optContainer.appendChild(optDiv); });
                });
            },
            renderEventInputs: (zone) => {
                const container = $('containerEvents'); container.innerHTML = ''; if (!zone.data.customEvents) zone.data.customEvents = [];
                zone.data.customEvents.forEach((evt, idx) => {
                    const card = document.createElement('div'); card.className = 'dynamic-card';
                    let borderColor = 'var(--danger)'; if(evt.color === 'yellow') borderColor = 'var(--accent-gold)'; if(evt.color === 'green') borderColor = 'var(--success)'; if(evt.color === 'purple') borderColor = 'var(--accent-purple)'; card.style.borderColor = borderColor;
                    card.innerHTML = `<div class="dynamic-card-header"><select class="card-color-select" onchange="ui.updateEvent(${idx}, 'color', this.value)"><option value="red" ${evt.color==='red'?'selected':''}>🔴</option><option value="yellow" ${evt.color==='yellow'?'selected':''}>🟡</option><option value="green" ${evt.color==='green'?'selected':''}>🟢</option><option value="purple" ${evt.color==='purple'?'selected':''}>🟣</option></select><input type="text" placeholder="Evento" value="${evt.name}" oninput="ui.updateEvent(${idx}, 'name', this.value)" style="color:${borderColor}; font-weight:bold; width:100%;"><button class="btn-icon" onclick="ui.saveEventAsPreset(${idx})" title="Salvar como Predefinição"><i class="fas fa-save"></i></button><button class="btn-icon" onclick="ui.removeEvent(${idx})"><i class="fas fa-trash"></i></button></div><textarea placeholder="Descrição..." oninput="ui.updateEvent(${idx}, 'desc', this.value)" style="min-height:60px">${evt.desc}</textarea>`;
                    container.appendChild(card);
                });
                ui.updatePresetSelect();
            },
            addPoiCategory: () => { AppState.zones[AppState.selectedZoneId].data.customPois.push({title:'', icon:'none', options:[]}); ui.updateZoneEditor(AppState.selectedZoneId); },
            removePoiCat: (idx) => { AppState.zones[AppState.selectedZoneId].data.customPois.splice(idx, 1); ui.updateZoneEditor(AppState.selectedZoneId); },
            updatePoiCat: (idx, field, val) => { AppState.zones[AppState.selectedZoneId].data.customPois[idx][field] = val; if(field === 'icon') ui.updateZoneEditor(AppState.selectedZoneId); },
            addPoiOption: (catIdx) => { AppState.zones[AppState.selectedZoneId].data.customPois[catIdx].options.push({name:'', desc:''}); ui.updateZoneEditor(AppState.selectedZoneId); },
            removePoiOpt: (catIdx, optIdx) => { AppState.zones[AppState.selectedZoneId].data.customPois[catIdx].options.splice(optIdx, 1); ui.updateZoneEditor(AppState.selectedZoneId); },
            updatePoiOpt: (catIdx, optIdx, field, val) => { AppState.zones[AppState.selectedZoneId].data.customPois[catIdx].options[optIdx][field] = val; },
            addEventItem: () => { AppState.zones[AppState.selectedZoneId].data.customEvents.push({name:'', desc:'', color:'red'}); ui.updateZoneEditor(AppState.selectedZoneId); },
            removeEvent: (idx) => { AppState.zones[AppState.selectedZoneId].data.customEvents.splice(idx, 1); ui.updateZoneEditor(AppState.selectedZoneId); },
            updateEvent: (idx, field, val) => { AppState.zones[AppState.selectedZoneId].data.customEvents[idx][field] = val; if(field === 'color') ui.updateZoneEditor(AppState.selectedZoneId); }
        };
        $('zoneTitle').addEventListener('input', (e) => { if(AppState.selectedZoneId) { AppState.zones[AppState.selectedZoneId].data.title = e.target.value; $(`label-${AppState.selectedZoneId}`).innerText = e.target.value; } });
        $('zoneDesc').addEventListener('input', (e) => { if(AppState.selectedZoneId) { AppState.zones[AppState.selectedZoneId].data.desc = e.target.value; } });

        const mapSystem = {
            scale: 1, currentX: 0, currentY: 0, mode: 'pan', container: $('mapContainer'), viewport: $('viewport'), svgOverlay: $('drawingSvg'), isDraggingMap: false, lastMouseX: 0, lastMouseY: 0, isDrawing: false, drawStartX: 0, drawStartY: 0, tempZoneEl: null, polyPoints: [], activeBgImageId: null, isDraggingBg: false,
            init() {
                $('markerList').classList.add('sidebar-disabled'); window.addEventListener('click', () => $('tokenCtxMenu').style.display = 'none');
                $('extraImageUpload').addEventListener('change', (e) => { const file = e.target.files[0]; if(file) { const cx = (-this.currentX + this.viewport.clientWidth/2) / this.scale; const cy = (-this.currentY + this.viewport.clientHeight/2) / this.scale; bgManager.add(file, cx - 100, cy - 100); } });
                this.viewport.addEventListener('mousedown', (e) => this.onMouseDown(e)); window.addEventListener('mousemove', (e) => this.onMouseMove(e)); window.addEventListener('mouseup', (e) => this.onMouseUp(e)); window.addEventListener('keydown', (e) => this.onKeyDown(e)); this.viewport.addEventListener('wheel', (e) => this.onWheel(e), {passive: false}); this.viewport.addEventListener('contextmenu', (e) => { e.preventDefault(); if(this.mode === 'draw-poly') return; if(e.target.classList.contains('zone') || e.target.id==='mapImage' || e.target.classList.contains('bg-prop-image')) this.addMarkerAtMouse(e); });
                this.viewport.addEventListener('dragover', (e) => e.preventDefault()); this.viewport.addEventListener('drop', (e) => this.onDrop(e));
            },
            onDrop(e) { e.preventDefault(); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { const file = e.dataTransfer.files[0]; if (file.type.startsWith('image/')) { const pos = this.getMousePosInMap(e); bgManager.add(file, pos.x, pos.y); return; } } const tokenId = e.dataTransfer.getData("text/plain"); if (tokenId) { const pos = this.getMousePosInMap(e); tokenManager.placeTokenOnMap(tokenId, pos.x, pos.y); } },
            setTool(tool) {
                if (tool === 'edit-bg' && this.mode === 'edit-bg') { tool = 'pan'; } this.mode = tool; $('toolPan').classList.toggle('active', tool === 'pan'); $('toolDraw').classList.toggle('active', tool.startsWith('draw')); $('toolEditBg').classList.toggle('active', tool === 'edit-bg'); 
                if (tool === 'edit-bg') { this.viewport.classList.add('editing-bg'); document.querySelectorAll('.zone, .token-map').forEach(el => el.style.pointerEvents = 'none'); } else { this.viewport.classList.remove('editing-bg'); document.querySelectorAll('.zone, .token-map').forEach(el => el.style.pointerEvents = 'auto'); this.activeBgImageId = null; document.querySelectorAll('.bg-prop-image').forEach(el => el.classList.remove('active')); }
                const drawBtn = $('toolDraw'); if (tool === 'draw-rect') drawBtn.innerHTML = '<i class="far fa-square"></i>'; else if (tool === 'draw-ellipse') drawBtn.innerHTML = '<i class="far fa-circle"></i>'; else if (tool === 'draw-poly') drawBtn.innerHTML = '<i class="fas fa-draw-polygon"></i>'; else drawBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                this.viewport.className = tool.startsWith('draw') ? 'viewport draw-mode' : (tool === 'edit-bg' ? 'viewport editing-bg' : 'viewport'); if (tool !== 'draw-poly') this.cancelPolygon();
            },
            updateTransform() { this.container.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`; }, getMousePosInMap(e) { const rect = this.container.getBoundingClientRect(); return { x: (e.clientX - rect.left) / this.scale, y: (e.clientY - rect.top) / this.scale }; },
            onMouseDown(e) {
                if (e.target.closest('.tools-overlay') || e.target.closest('.sidebar') || e.target.closest('.bottom-left-ui')) return;
                if (this.mode === 'edit-bg') { if (e.target.classList.contains('bg-prop-image')) { e.stopPropagation(); this.activeBgImageId = e.target.id.replace('bg-',''); this.isDraggingBg = true; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; document.querySelectorAll('.bg-prop-image').forEach(el => el.classList.remove('active')); e.target.classList.add('active'); return; } else { this.activeBgImageId = null; document.querySelectorAll('.bg-prop-image').forEach(el => el.classList.remove('active')); } }
                if (e.target.classList.contains('token-map')) return; 
                if (e.button === 0) {
                    if (this.mode === 'pan' || (this.mode === 'edit-bg' && !this.activeBgImageId)) { this.isDraggingMap = true; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; this.viewport.style.cursor = 'grabbing'; } 
                    else if (this.mode.startsWith('draw')) {
                        if (this.mode === 'draw-poly') { const pos = this.getMousePosInMap(e); if (this.polyPoints.length > 2) { const first = this.polyPoints[0]; const dist = Math.sqrt(Math.pow(pos.x - first.x, 2) + Math.pow(pos.y - first.y, 2)); if (dist < 15) { this.finishPolygon(); return; } } this.addPolyPoint(pos.x, pos.y); } 
                        else { this.isDrawing = true; const pos = this.getMousePosInMap(e); this.drawStartX = pos.x; this.drawStartY = pos.y; this.tempZoneEl = document.createElement('div'); this.tempZoneEl.className = this.mode === 'draw-ellipse' ? 'zone ellipse' : 'zone'; this.tempZoneEl.style.left = pos.x + 'px'; this.tempZoneEl.style.top = pos.y + 'px'; this.container.appendChild(this.tempZoneEl); }
                    }
                }
            },
            onMouseMove(e) {
                if (this.isDraggingMap) { const dx = e.clientX - this.lastMouseX; const dy = e.clientY - this.lastMouseY; this.currentX += dx; this.currentY += dy; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; this.updateTransform(); } 
                else if (this.mode === 'edit-bg' && this.isDraggingBg && this.activeBgImageId) { const imgData = AppState.bgImages.find(i => i.id === this.activeBgImageId); if (imgData) { const dx = (e.clientX - this.lastMouseX) / this.scale; const dy = (e.clientY - this.lastMouseY) / this.scale; imgData.x += dx; imgData.y += dy; bgManager.render(imgData, true); this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; } }
                else if (this.isDrawing && this.tempZoneEl) { const pos = this.getMousePosInMap(e); const width = pos.x - this.drawStartX; const height = pos.y - this.drawStartY; this.tempZoneEl.style.width = Math.abs(width) + 'px'; this.tempZoneEl.style.height = Math.abs(height) + 'px'; this.tempZoneEl.style.left = (width < 0 ? pos.x : this.drawStartX) + 'px'; this.tempZoneEl.style.top = (height < 0 ? pos.y : this.drawStartY) + 'px'; }
                else if (this.mode === 'draw-poly' && this.polyPoints.length > 0) { const pos = this.getMousePosInMap(e); this.renderPolyGuide(pos); }
            },
            onMouseUp(e) {
                if (this.isDraggingMap) { this.isDraggingMap = false; this.viewport.style.cursor = ''; } else if (this.isDraggingBg) { this.isDraggingBg = false; }
                else if (this.isDrawing) { this.isDrawing = false; if (this.tempZoneEl) { const id = generateId(); const w = parseFloat(this.tempZoneEl.style.width); const h = parseFloat(this.tempZoneEl.style.height); if (w > 10 && h > 10) { const rect = { id: id, type: this.mode === 'draw-ellipse' ? 'ellipse' : 'rect', x: parseFloat(this.tempZoneEl.style.left), y: parseFloat(this.tempZoneEl.style.top), w: w, h: h, data: { title: 'Nova Zona', desc: '', customPois: [], customEvents: [] } }; AppState.zones[id] = rect; this.renderZone(rect, this.tempZoneEl); this.selectZone(id); ui.setEditMode(true); } else { this.tempZoneEl.remove(); } this.tempZoneEl = null; this.setTool('pan'); } }
            },
            onWheel(e) {
                if (this.mode === 'edit-bg' && this.activeBgImageId) { e.preventDefault(); e.stopPropagation(); const imgData = AppState.bgImages.find(i => i.id === this.activeBgImageId); if (imgData) { if (e.shiftKey) { imgData.rotation += (e.deltaY > 0 ? 5 : -5); } else { const scaleDelta = 0.05; imgData.scale += (e.deltaY > 0 ? -scaleDelta : scaleDelta); if (imgData.scale < 0.1) imgData.scale = 0.1; } bgManager.render(imgData, true); } } 
                else { if (e.ctrlKey) return; e.preventDefault(); const rect = this.viewport.getBoundingClientRect(); const mx = e.clientX - rect.left; const my = e.clientY - rect.top; const worldX = (mx - this.currentX) / this.scale; const worldY = (my - this.currentY) / this.scale; const zoomFactor = 0.1; const direction = e.deltaY > 0 ? -1 : 1; let newScale = this.scale * (1 + (direction * zoomFactor)); newScale = Math.min(Math.max(0.1, newScale), 8); this.currentX = mx - (worldX * newScale); this.currentY = my - (worldY * newScale); this.scale = newScale; this.updateTransform(); }
            },
            onKeyDown(e) {
                if (this.mode === 'draw-poly' && this.polyPoints.length > 2) { if (e.key === 'Enter') this.finishPolygon(); if (e.key === 'Escape') this.cancelPolygon(); }
                if (e.key === ' ') this.setTool('pan');
                if ((e.key === 'Delete' || e.key === 'Backspace') && this.mode === 'edit-bg' && this.activeBgImageId) { bgManager.delete(this.activeBgImageId); this.activeBgImageId = null; }
            },
            addPolyPoint(x, y) { this.polyPoints.push({x, y}); this.renderPolyGuide({x, y}); },
            renderPolyGuide(mousePos) { this.svgOverlay.innerHTML = ''; if (this.polyPoints.length === 0) return; let pointsStr = this.polyPoints.map(p => `${p.x},${p.y}`).join(' '); const pathStr = `M ${pointsStr} L ${mousePos.x},${mousePos.y}`; const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", pathStr); path.setAttribute("class", "poly-line"); path.setAttribute("fill", "none"); this.svgOverlay.appendChild(path); this.polyPoints.forEach((p, idx) => { const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("cx", p.x); circle.setAttribute("cy", p.y); circle.setAttribute("r", idx === 0 ? 5 : 3); circle.setAttribute("class", "poly-point"); this.svgOverlay.appendChild(circle); }); },
            cancelPolygon() { this.polyPoints = []; this.svgOverlay.innerHTML = ''; },
            finishPolygon() { if (this.polyPoints.length < 3) { this.cancelPolygon(); return; } const xs = this.polyPoints.map(p => p.x); const ys = this.polyPoints.map(p => p.y); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); let w = maxX - minX; let h = maxY - minY; if(w < 1) w = 1; if(h < 1) h = 1; const clipPoints = this.polyPoints.map(p => { const px = ((p.x - minX) / w) * 100; const py = ((p.y - minY) / h) * 100; return `${px}% ${py}%`; }).join(', '); const id = generateId(); const zoneData = { id: id, type: 'polygon', x: minX, y: minY, w: w, h: h, clipPath: `polygon(${clipPoints})`, points: [...this.polyPoints], data: { title: 'Zona Poligonal', desc: '', customPois: [], customEvents: [] } }; AppState.zones[id] = zoneData; this.renderZone(zoneData); this.selectZone(id); ui.setEditMode(true); this.cancelPolygon(); this.setTool('pan'); },
            renderZone(zoneData, existingEl = null) { const el = existingEl || document.createElement('div'); el.className = 'zone'; if (zoneData.type === 'ellipse') el.classList.add('ellipse'); if (zoneData.type === 'polygon') { el.classList.add('polygon'); el.style.clipPath = zoneData.clipPath; } el.id = `zone-${zoneData.id}`; el.style.left = zoneData.x + 'px'; el.style.top = zoneData.y + 'px'; el.style.width = zoneData.w + 'px'; el.style.height = zoneData.h + 'px'; const label = document.createElement('div'); label.className = 'zone-label'; label.innerText = zoneData.data.title; label.id = `label-${zoneData.id}`; el.appendChild(label); el.onclick = (e) => { e.stopPropagation(); if (this.mode === 'pan') { this.selectZone(zoneData.id); ui.setEditMode(false); } }; if (!existingEl) this.container.appendChild(el); },
            selectZone(id) { document.querySelectorAll('.zone').forEach(z => z.classList.remove('active')); const el = $(`zone-${id}`); if (el) el.classList.add('active'); AppState.selectedZoneId = id; ui.updateZoneEditor(id); ui.toggleSidebar('left', true); },
            deleteSelectedZone() { if(AppState.selectedZoneId) { const el = $(`zone-${AppState.selectedZoneId}`); if(el) el.remove(); delete AppState.zones[AppState.selectedZoneId]; AppState.selectedZoneId = null; ui.updateZoneEditor(null); } },
            addMarkerAtMouse(e) { const pos = this.getMousePosInMap(e); const id = generateId(); const marker = { id, x: pos.x, y: pos.y, text: "Novo Marcador" }; AppState.markers[id] = marker; markerManager.renderMarkerOnMap(marker); markerManager.renderList(); markerManager.focusMarker(id); }
        };

        const markerManager = {
            renderMarkerOnMap(m) { const el = document.createElement('div'); el.className = 'marker'; el.innerHTML = '<i class="fas fa-map-pin"></i>'; el.style.left = m.x + 'px'; el.style.top = m.y + 'px'; el.title = m.text; el.id = `map-marker-${m.id}`; el.onclick = (e) => { e.stopPropagation(); this.focusMarker(m.id); }; mapSystem.container.appendChild(el); },
            renderList() { const list = $('markerList'); list.innerHTML = ''; Object.values(AppState.markers).forEach(m => { const item = document.createElement('div'); item.className = 'form-group'; item.id = `list-item-${m.id}`; item.style.borderBottom = '1px solid #333'; item.style.paddingBottom = '10px'; item.innerHTML = `<div style="display:flex; gap:5px;"><input type="text" value="${m.text}" oninput="markerManager.updateText('${m.id}', this.value)" onfocus="markerManager.highlightOnMap('${m.id}')"><button class="btn-outline" style="color:var(--danger)" onclick="markerManager.delete('${m.id}')"><i class="fas fa-trash"></i></button></div>`; list.appendChild(item); }); },
            focusMarker(id) { ui.toggleSidebar('right', true); setTimeout(() => { const input = document.querySelector(`#list-item-${id} input`); if(input && AppState.editingMarkers) input.focus(); this.highlightOnMap(id); }, 100); },
            highlightOnMap(id) { document.querySelectorAll('.marker').forEach(m => m.classList.remove('active')); const el = $(`map-marker-${id}`); if(el) el.classList.add('active'); },
            updateText(id, txt) { AppState.markers[id].text = txt; $(`map-marker-${id}`).title = txt; },
            delete(id) { delete AppState.markers[id]; $(`map-marker-${id}`).remove(); this.renderList(); }
        };

        const tokenManager = {
            activeCtxToken: null, editingId: null,
            getDefaultStats(type) { if (type === 'threat') { return { type: 'threat', threatType: 'realidade', system: 'san', pv: 50, maxPv: 50, agi: 1, for: 1, int: 1, pre: 1, vig: 1, def: 10, bloq: 0, esq: 0, size: 'Médio', speed: '9m', elements: [], senses: [], resistances: [], vulnerabilities: [], abilities: [], actions: [], presDt: 0, presDano: '', presNex: 0, enigma: '' }; } return { type: 'player', system: 'san', pv: 10, maxPv: 10, pe: 5, maxPe: 5, san: 10, maxSan: 10, pd: 5, maxPd: 5, agi: 1, for: 1, int: 1, pre: 1, vig: 1, def: 10, bloq: 0, esq: 0 }; },
            toggleFichaType() {
                const type = $('fichaType').value; const sys = $('fichaSystem').value; const threatType = $('fichaThreatType').value;
                if (type === 'threat') { $('fichaSystem').style.display = 'none'; $('fichaThreatType').style.display = 'block'; $('rowPe').style.display = 'none'; $('rowSan').style.display = 'none'; $('rowDet').style.display = 'none'; $('colFort').style.display = 'block'; $('colVon').style.display = 'block'; $('threatDynamicLists').style.display = 'block'; $('threatSettingsBlock').style.display = 'block'; $('lblEsq').innerText = "Reflexos"; if (threatType === 'paranormal') { $('paranormalSettingsBlock').style.display = 'block'; $('editEnigmaBlock').style.display = 'block'; } else { $('paranormalSettingsBlock').style.display = 'none'; $('editEnigmaBlock').style.display = 'none'; } } 
                else { $('fichaSystem').style.display = 'block'; $('fichaThreatType').style.display = 'none'; $('colFort').style.display = 'none'; $('colVon').style.display = 'none'; $('threatDynamicLists').style.display = 'none'; $('threatSettingsBlock').style.display = 'none'; $('lblEsq').innerText = "Esquiva"; if (sys === 'san') { $('rowPe').style.display = 'flex'; $('rowSan').style.display = 'flex'; $('rowDet').style.display = 'none'; } else { $('rowPe').style.display = 'none'; $('rowSan').style.display = 'none'; $('rowDet').style.display = 'flex'; } }
            },
            handleTypeChange() { const newType = $('fichaType').value; const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(!t) return; if (t.stats.type !== newType) { if(confirm(`Mudar de ${t.stats.type} para ${newType} irá ZERAR os status exclusivos dessa ficha. Deseja continuar?`)) { t.stats = this.getDefaultStats(newType); this.showPeculiarities(t.id, false); } else { $('fichaType').value = t.stats.type; } } else { this.toggleFichaType(); } },
            quickEditPV(amount) { if(!this.activeCtxToken) return; const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t) { t.stats.pv += amount; if(t.stats.pv < 0) t.stats.pv = 0; if(t.stats.pv > t.stats.maxPv) t.stats.pv = t.stats.maxPv; this.showPeculiarities(t.id, true); } },
            addArrayItem(arrName, val) { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(!t || !t.stats) return; if(!t.stats[arrName]) t.stats[arrName] = []; if(arrName === 'elements') { if(!t.stats.elements.includes(val)) t.stats.elements.push(val); } else if(arrName === 'senses') { t.stats.senses.push(''); } else if(arrName === 'resistances') { t.stats.resistances.push({type: 'Sangue', val: 5}); } else if(arrName === 'vulnerabilities') { t.stats.vulnerabilities.push('Sangue'); } else if(arrName === 'abilities') { t.stats.abilities.push({title: '', desc: ''}); } else if(arrName === 'actions') { t.stats.actions.push({type: 'Padrão', name: '', test: '', damage: '', mult: 'x1', desc: ''}); } this.renderThreatEditorLists(t); },
            removeArrayItem(arrName, idx) { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t && t.stats && t.stats[arrName]) { t.stats[arrName].splice(idx, 1); this.renderThreatEditorLists(t); } },
            updateArrayItem(arrName, idx, field, val) { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t && t.stats && t.stats[arrName]) { if(field === null) t.stats[arrName][idx] = val; else t.stats[arrName][idx][field] = val; } },
            renderThreatEditorLists(t) {
                let elHtml = ''; (t.stats.elements || []).forEach((el, idx) => { elHtml += `<span class="elem-badge elem-${el.toLowerCase()}">${el} <i class="fas fa-times" style="cursor:pointer; margin-left:3px;" onclick="tokenManager.removeArrayItem('elements', ${idx})"></i></span>`; }); $('fElementsList').innerHTML = elHtml;
                let senHtml = `<label style="color:var(--text-sec); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Sentidos e Perícias</label>`; (t.stats.senses || []).forEach((s, idx) => { senHtml += `<div style="display:flex; gap:5px; margin-bottom:5px;"><input type="text" value="${s}" placeholder="Ex: Iniciativa 2d20+5" oninput="tokenManager.updateArrayItem('senses', ${idx}, null, this.value)"><button class="btn-icon" onclick="tokenManager.removeArrayItem('senses', ${idx})"><i class="fas fa-times"></i></button></div>`; }); senHtml += `<button class="btn-outline" style="width:100%; border-style:dashed; margin-bottom:15px;" onclick="tokenManager.addArrayItem('senses')">+ Perícia/Sentido</button>`; $('editSenses').innerHTML = senHtml;
                const dmgOpts = DAMAGE_TYPES.map(d => `<option value="${d}">${d}</option>`).join(''); let resHtml = `<label style="color:var(--text-sec); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Resistências a Dano</label>`; (t.stats.resistances || []).forEach((r, idx) => { resHtml += `<div style="display:flex; gap:5px; margin-bottom:5px;"><input type="number" style="width:60px;" value="${r.val}" oninput="tokenManager.updateArrayItem('resistances', ${idx}, 'val', parseInt(this.value)||0)"><select onchange="tokenManager.updateArrayItem('resistances', ${idx}, 'type', this.value)">${DAMAGE_TYPES.map(d => `<option value="${d}" ${r.type===d?'selected':''}>${d}</option>`).join('')}</select><button class="btn-icon" onclick="tokenManager.removeArrayItem('resistances', ${idx})"><i class="fas fa-times"></i></button></div>`; }); resHtml += `<button class="btn-outline" style="width:100%; border-style:dashed; margin-bottom:15px;" onclick="tokenManager.addArrayItem('resistances')">+ Resistência</button>`; $('editResistances').innerHTML = resHtml;
                let vulHtml = `<label style="color:var(--text-sec); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Vulnerabilidades</label>`; (t.stats.vulnerabilities || []).forEach((v, idx) => { vulHtml += `<div style="display:flex; gap:5px; margin-bottom:5px;"><select style="flex:1;" onchange="tokenManager.updateArrayItem('vulnerabilities', ${idx}, null, this.value)">${DAMAGE_TYPES.map(d => `<option value="${d}" ${v===d?'selected':''}>${d}</option>`).join('')}</select><button class="btn-icon" onclick="tokenManager.removeArrayItem('vulnerabilities', ${idx})"><i class="fas fa-times"></i></button></div>`; }); vulHtml += `<button class="btn-outline" style="width:100%; border-style:dashed; margin-bottom:15px;" onclick="tokenManager.addArrayItem('vulnerabilities')">+ Vulnerabilidade</button>`; $('editVulnerabilities').innerHTML = vulHtml;
                let abHtml = `<label style="color:var(--text-sec); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Habilidades</label>`; (t.stats.abilities || []).forEach((a, idx) => { abHtml += `<div class="dynamic-card"><div style="display:flex; gap:5px; margin-bottom:5px;"><input type="text" placeholder="Nome da Habilidade" value="${a.title}" oninput="tokenManager.updateArrayItem('abilities', ${idx}, 'title', this.value)"><button class="btn-icon" onclick="tokenManager.removeArrayItem('abilities', ${idx})"><i class="fas fa-trash"></i></button></div><textarea placeholder="Descrição..." oninput="tokenManager.updateArrayItem('abilities', ${idx}, 'desc', this.value)" style="min-height:50px">${a.desc}</textarea></div>`; }); abHtml += `<button class="btn-outline" style="width:100%; border-style:dashed; margin-bottom:15px;" onclick="tokenManager.addArrayItem('abilities')">+ Habilidade</button>`; $('editAbilities').innerHTML = abHtml;
                let acHtml = `<label style="color:var(--text-sec); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Ações</label>`; (t.stats.actions || []).forEach((a, idx) => { acHtml += `<div class="dynamic-card"><div style="display:flex; gap:5px; margin-bottom:5px;"><select style="width:110px;" onchange="tokenManager.updateArrayItem('actions', ${idx}, 'type', this.value)">${ACTION_TYPES.map(at => `<option value="${at}" ${a.type===at?'selected':''}>${at}</option>`).join('')}</select><input type="text" placeholder="Nome da Ação" value="${a.name}" oninput="tokenManager.updateArrayItem('actions', ${idx}, 'name', this.value)" style="flex:1;"><button class="btn-icon" onclick="tokenManager.removeArrayItem('actions', ${idx})"><i class="fas fa-trash"></i></button></div><div style="display:flex; gap:5px; margin-bottom:5px;"><input type="text" placeholder="Teste (ex: 2d20+5)" value="${a.test}" oninput="tokenManager.updateArrayItem('actions', ${idx}, 'test', this.value)" style="flex:1;"><input type="text" placeholder="Dano (ex: 1d6 Corte)" value="${a.damage}" oninput="tokenManager.updateArrayItem('actions', ${idx}, 'damage', this.value)" style="flex:1;"><input type="text" placeholder="Mult (x2)" value="${a.mult}" oninput="tokenManager.updateArrayItem('actions', ${idx}, 'mult', this.value)" style="width:60px;"></div><textarea placeholder="Efeito Adicional ou Opções..." oninput="tokenManager.updateArrayItem('actions', ${idx}, 'desc', this.value)" style="min-height:40px">${a.desc}</textarea></div>`; }); acHtml += `<button class="btn-outline" style="width:100%; border-style:dashed; margin-bottom:15px;" onclick="tokenManager.addArrayItem('actions')">+ Ação</button>`; $('editActions').innerHTML = acHtml;
            },
            openModal(editMode = false) { const title = editMode ? 'Editar Token' : 'Criar Novo Token'; const btnText = editMode ? 'Salvar' : 'Criar Token'; $('modalTitle').innerText = title; const confirmBtn = document.querySelector('#tokenModal .btn'); confirmBtn.innerText = btnText; if (!editMode) { this.editingId = null; $('tokenNameInput').value = ''; $('tokenInitialsInput').value = ''; $('tokenColorText').value = '#ffffff'; $('tokenColorBorder').value = '#ffffff'; $('tokenColorFill').value = '#8257e5'; } else { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t) { this.editingId = t.id; $('tokenNameInput').value = t.fullName; $('tokenInitialsInput').value = t.name; $('tokenColorText').value = t.colorText; $('tokenColorBorder').value = t.colorBorder; $('tokenColorFill').value = t.colorFill; } } $('tokenModal').style.display = 'flex'; $('tokenCtxMenu').style.display = 'none'; },
            closeModal() { $('tokenModal').style.display = 'none'; this.editingId = null; },
            confirmToken() { const name = $('tokenNameInput').value || 'Token'; const initials = $('tokenInitialsInput').value.substring(0,4).toUpperCase() || name.substring(0,2).toUpperCase(); const colorText = $('tokenColorText').value; const colorBorder = $('tokenColorBorder').value; const colorFill = $('tokenColorFill').value; if (this.editingId) { const t = AppState.tokens.find(tok => tok.id === this.editingId); if(t) { t.name = initials; t.fullName = name; t.colorText = colorText; t.colorBorder = colorBorder; t.colorFill = colorFill; if (t.x !== null) this.placeTokenOnMap(t.id, t.x, t.y); } } else { const token = { id: generateId(), name: initials, fullName: name, colorText, colorBorder, colorFill, x: null, y: null, desc: '', conditions: [], stats: this.getDefaultStats('player') }; AppState.tokens.push(token); } this.renderRoster(); this.closeModal(); if(typeof initSystem !== 'undefined') initSystem.render(); },
            createToken() { this.openModal(false); },
            openPeculiarities() { this.showPeculiarities(this.activeCtxToken, true); $('tokenCtxMenu').style.display = 'none'; },
            toggleFichaEditMode() { const isReading = $('peculReadMode').style.display === 'block'; if (isReading) { this.showPeculiarities(this.activeCtxToken, false); } else { this.savePeculiarities(); this.showPeculiarities(this.activeCtxToken, true); } },
            showPeculiarities(tokenId, readOnly) {
                const t = AppState.tokens.find(tok => tok.id === tokenId); if(!t) return; this.activeCtxToken = tokenId; 
                if (!t.stats) t.stats = this.getDefaultStats('player');
                $('fichaMainTitle').innerText = t.fullName;
                let subHtml = ''; if(t.stats.type === 'threat') { if(t.stats.threatType === 'paranormal') { (t.stats.elements || []).forEach(el => { subHtml += `<span class="elem-badge elem-${el.toLowerCase()}">${el}</span>`; }); } subHtml += `<span style="font-size:0.7rem; color:var(--text-sec); border:1px solid var(--border); padding:2px 8px; border-radius:12px;">${t.stats.size || 'Médio'}</span>`; }
                $('fichaSubtitle').innerHTML = subHtml;
                $('peculiaritiesModal').style.display = 'flex';
                
                if (readOnly) { 
                    $('peculReadMode').style.display = 'block'; $('peculEditMode').style.display = 'none'; 
                    let html = `<div style="display:flex; gap:10px; margin-bottom:10px; align-items:stretch;">`;
                    const pvWarn = (t.stats.pv <= t.stats.maxPv / 2) && (t.stats.maxPv > 0) ? 'warning-red' : '';
                    html += `<div class="stat-box red ${pvWarn}" style="flex:1;"><span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec); margin-bottom:5px;">PV</span><span style="font-size:1.4rem; font-weight:bold; color:var(--text-main); margin-bottom:5px;">${t.stats.pv} / ${t.stats.maxPv}</span><div style="display:flex; justify-content:center;"><button class="quick-btn" onclick="tokenManager.quickEditPV(-5)">-5</button><button class="quick-btn" onclick="tokenManager.quickEditPV(-1)">-1</button><button class="quick-btn" onclick="tokenManager.quickEditPV(1)">+1</button><button class="quick-btn" onclick="tokenManager.quickEditPV(5)">+5</button></div></div>`;
                    
                    if (t.stats.type === 'player') {
                        if (t.stats.system === 'san') {
                            const sanWarn = (t.stats.san <= t.stats.maxSan / 2) && (t.stats.maxSan > 0) ? 'warning-blue' : '';
                            html += `<div style="display:flex; flex-direction:column; gap:5px; flex:1;"><div class="stat-box green" style="flex:1; justify-content:center;"><span style="font-size:0.6rem; font-weight:bold; color:var(--text-sec);">PE</span><span style="font-size:1.1rem; font-weight:bold; color:var(--text-main);">${t.stats.pe} / ${t.stats.maxPe}</span></div><div class="stat-box blue ${sanWarn}" style="flex:1; justify-content:center;"><span style="font-size:0.6rem; font-weight:bold; color:var(--text-sec);">SAN</span><span style="font-size:1.1rem; font-weight:bold; color:var(--text-main);">${t.stats.san} / ${t.stats.maxSan}</span></div></div>`;
                        } else {
                            const pdWarn = (t.stats.pd <= t.stats.maxPd / 2) && (t.stats.maxPd > 0) ? 'warning-teal' : '';
                            html += `<div class="stat-box teal ${pdWarn}" style="flex:1; justify-content:center;"><span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec);">PD</span><span style="font-size:1.4rem; font-weight:bold; color:var(--text-main);">${t.stats.pd} / ${t.stats.maxPd}</span></div>`;
                        }
                    }
                    html += `</div>`;
                    html += `<div style="display:flex; justify-content:space-between; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; border:1px solid var(--border);"><div style="text-align:center;"><div class="attr-circle">${t.stats.agi}</div><span style="font-size:0.7rem;color:var(--text-sec);font-weight:bold;">AGI</span></div><div style="text-align:center;"><div class="attr-circle">${t.stats.for}</div><span style="font-size:0.7rem;color:var(--text-sec);font-weight:bold;">FOR</span></div><div style="text-align:center;"><div class="attr-circle">${t.stats.int}</div><span style="font-size:0.7rem;color:var(--text-sec);font-weight:bold;">INT</span></div><div style="text-align:center;"><div class="attr-circle">${t.stats.pre}</div><span style="font-size:0.7rem;color:var(--text-sec);font-weight:bold;">PRE</span></div><div style="text-align:center;"><div class="attr-circle">${t.stats.vig}</div><span style="font-size:0.7rem;color:var(--text-sec);font-weight:bold;">VIG</span></div></div>`;
                    html += `<div style="display:flex; justify-content:space-around; margin-bottom:20px; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; border:1px solid var(--border);"><div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">DEFESA</span>${t.stats.def}</div>`;
                    if(t.stats.type === 'player') { html += `<div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">BLOQUEIO</span>${t.stats.bloq}</div><div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">ESQUIVA</span>${t.stats.esq}</div>`; } 
                    else { html += `<div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">FORTITUDE</span>${t.stats.bloq || '0'}</div><div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">REFLEXOS</span>${t.stats.esq || '0'}</div><div style="text-align:center; font-weight:bold; font-size:1.2rem;"><span style="color:var(--text-sec); font-size:0.7rem; display:block; margin-bottom:2px;">VONTADE</span>${t.stats.von || '0'}</div>`; }
                    html += `</div>`;
                    $('peculReadStats').innerHTML = html;

                    let listsHtml = '';
                    if (t.stats.type === 'threat') {
                        if(t.stats.threatType === 'paranormal') { listsHtml += `<div style="margin-bottom:15px;"><strong style="color:var(--accent-purple);">Presença Perturbadora:</strong> DT ${t.stats.presDt} | ${t.stats.presDano} Mental | Imune NEX ${t.stats.presNex}%</div>`; }
                        listsHtml += `<div style="margin-bottom:10px;"><strong>Deslocamento:</strong> ${t.stats.speed || '9m'}</div>`;
                        if(t.stats.senses && t.stats.senses.length > 0) listsHtml += `<div style="margin-bottom:10px;"><strong>Sentidos & Perícias:</strong> ${t.stats.senses.join(', ')}</div>`;
                        let resStr = (t.stats.resistances||[]).map(r => `${r.type} ${r.val}`).join(', '); if(resStr) listsHtml += `<div style="margin-bottom:10px;"><strong>Resistências:</strong> ${resStr}</div>`;
                        if(t.stats.vulnerabilities && t.stats.vulnerabilities.length > 0) listsHtml += `<div style="margin-bottom:15px;"><strong>Vulnerabilidades:</strong> ${t.stats.vulnerabilities.join(', ')}</div>`;
                        if(t.stats.abilities && t.stats.abilities.length > 0) { listsHtml += `<h4 style="color:var(--accent-gold); border-bottom:1px solid #444; margin-bottom:5px;">Habilidades</h4>`; t.stats.abilities.forEach(a => { listsHtml += `<div style="margin-bottom:10px;"><strong>${a.title}.</strong> <span style="color:var(--text-sec);">${a.desc}</span></div>`; }); }
                        if(t.stats.actions && t.stats.actions.length > 0) { listsHtml += `<h4 style="color:var(--accent-gold); border-bottom:1px solid #444; margin-bottom:5px;">Ações</h4>`; t.stats.actions.forEach(a => { listsHtml += `<div class="event-item event-red" style="padding:10px;"><div style="font-weight:bold; font-size:1.1rem; color:var(--text-main);">${a.type} - ${a.name} <span style="font-size:0.8rem; color:var(--text-sec);">(${a.mult})</span></div><div style="font-size:0.9rem; color:var(--accent-gold); margin-bottom:5px;">Teste: ${a.test} | Dano: ${a.damage}</div><div style="font-size:0.85rem; color:var(--text-sec);">${a.desc}</div></div>`; }); }
                        if(t.stats.threatType === 'paranormal' && t.stats.enigma) { listsHtml += `<h4 style="color:var(--accent-purple); border-bottom:1px solid #444; margin-bottom:5px;">Enigma do Medo</h4>`; listsHtml += `<div class="enigma-box">${t.stats.enigma}</div>`; }
                    }
                    $('peculReadLists').innerHTML = listsHtml;

                    const descEl = $('peculReadDesc');
                    if (descEl) descEl.innerText = t.desc || 'Sem descrição.'; 
                    
                    const list = $('peculReadConditions'); 
                    if (list) {
                        list.innerHTML = ''; 
                        (t.conditions || []).forEach(c => { 
                            list.insertAdjacentHTML('beforeend', `<div class="event-item event-${c.color||'red'}"><span class="event-name">${c.name}</span><span style="font-size:0.9rem">${c.desc}</span></div>`); 
                        }); 
                    }
                } 
                else { 
                    $('peculReadMode').style.display = 'none'; $('peculEditMode').style.display = 'block'; 
                    
                    $('fichaType').value = t.stats.type; $('fichaSystem').value = t.stats.system; $('fichaThreatType').value = t.stats.threatType || 'realidade';
                    $('fAgi').value = t.stats.agi; $('fFor').value = t.stats.for; $('fInt').value = t.stats.int; $('fPre').value = t.stats.pre; $('fVig').value = t.stats.vig;
                    $('fDef').value = t.stats.def; $('fBloq').value = t.stats.bloq; $('fEsq').value = t.stats.esq;
                    if(t.stats.type === 'threat') $('fVon').value = t.stats.von || 0;
                    
                    $('fSpeed').value = t.stats.speed || ''; $('fSize').value = t.stats.size || 'Médio'; $('fPresDt').value = t.stats.presDt || 0; $('fPresDano').value = t.stats.presDano || ''; $('fPresNex').value = t.stats.presNex || 0; $('fEnigma').value = t.stats.enigma || '';
                    $('fPvCurr').value = t.stats.pv; $('fPvMax').value = t.stats.maxPv; $('fPeCurr').value = t.stats.pe; $('fPeMax').value = t.stats.maxPe; $('fSanCurr').value = t.stats.san; $('fSanMax').value = t.stats.maxSan; $('fPdCurr').value = t.stats.pd; $('fPdMax').value = t.stats.maxPd;

                    this.toggleFichaType(); if(t.stats.type === 'threat') this.renderThreatEditorLists(t);
                    $('peculDescInput').value = t.desc || ''; this.renderConditionsInput(t); 
                }
            },
            renderConditionsInput(token) {
                const container = $('containerConditions'); container.innerHTML = ''; if (!token.conditions) token.conditions = [];
                token.conditions.forEach((c, idx) => {
                    const card = document.createElement('div'); card.className = 'dynamic-card'; 
                    let borderColor = 'var(--danger)'; if(c.color === 'yellow') borderColor = 'var(--accent-gold)'; if(c.color === 'green') borderColor = 'var(--success)'; if(c.color === 'purple') borderColor = 'var(--accent-purple)'; card.style.borderColor = borderColor;
                    card.innerHTML = `<div class="dynamic-card-header"><select class="card-color-select" onchange="tokenManager.updateCondition(${idx}, 'color', this.value)"><option value="red" ${c.color==='red'?'selected':''}>🔴</option><option value="yellow" ${c.color==='yellow'?'selected':''}>🟡</option><option value="green" ${c.color==='green'?'selected':''}>🟢</option><option value="purple" ${c.color==='purple'?'selected':''}>🟣</option></select><input type="text" placeholder="Condição" value="${c.name}" oninput="tokenManager.updateCondition(${idx}, 'name', this.value)" style="color:${borderColor}; font-weight:bold; width:100%;"><button class="btn-icon" onclick="tokenManager.saveConditionAsPreset(${idx})" title="Salvar como Predefinição"><i class="fas fa-save"></i></button><button class="btn-icon" onclick="tokenManager.removeCondition(${idx})"><i class="fas fa-trash"></i></button></div><textarea placeholder="Efeito..." oninput="tokenManager.updateCondition(${idx}, 'desc', this.value)" style="min-height:60px">${c.desc}</textarea>`;
                    container.appendChild(card);
                });
                this.updatePresetSelect();
            },
            saveConditionAsPreset(idx) { if(!this.activeCtxToken) return; const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t && t.conditions[idx]) { if (!AppState.savedTokenConditions) AppState.savedTokenConditions = []; AppState.savedTokenConditions.push(JSON.parse(JSON.stringify(t.conditions[idx]))); this.updatePresetSelect(); alert("Condição customizada salva nas predefinições!"); } },
            addPresetCondition(val) {
                if(!this.activeCtxToken || val === '') return; const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(!t) return;
                let preset = null; if(val.startsWith('sys_')) { const idx = parseInt(val.split('_')[1]); preset = SYSTEM_CONDITIONS[idx]; } else if (val.startsWith('cust_')) { const idx = parseInt(val.split('_')[1]); preset = AppState.savedTokenConditions[idx]; }
                if(preset) { if(!t.conditions) t.conditions = []; t.conditions.push(JSON.parse(JSON.stringify(preset))); this.renderConditionsInput(t); }
            },
            updatePresetSelect() {
                const select = $('presetConditionSelect'); if(!select) return; let html = '<option value="">Carregar Condição...</option>';
                html += '<optgroup label="Sistema (Ordem Paranormal)">'; SYSTEM_CONDITIONS.forEach((c, idx) => { html += `<option value="sys_${idx}">${c.name}</option>`; }); html += '</optgroup>';
                if(AppState.savedTokenConditions && AppState.savedTokenConditions.length > 0) { html += '<optgroup label="Customizados">'; AppState.savedTokenConditions.forEach((c, idx) => { html += `<option value="cust_${idx}">${c.name || 'Sem nome'}</option>`; }); html += '</optgroup>'; }
                select.innerHTML = html;
            },
            clearCustomPresets() { if(confirm("Deseja apagar todas as predefinições customizadas de tokens? (As do sistema serão mantidas)")) { AppState.savedTokenConditions = []; this.updatePresetSelect(); } },
            addConditionItem() { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); t.conditions.push({name:'', desc:'', color:'red'}); this.renderConditionsInput(t); },
            removeCondition(idx) { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); t.conditions.splice(idx, 1); this.renderConditionsInput(t); },
            updateCondition(idx, field, val) { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); t.conditions[idx][field] = val; if(field==='color') this.renderConditionsInput(t); },
            savePeculiarities() { 
                const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); 
                if(t) {
                    t.desc = $('peculDescInput').value; t.stats.type = $('fichaType').value; t.stats.system = $('fichaSystem').value; t.stats.threatType = $('fichaThreatType').value;
                    t.stats.agi = parseInt($('fAgi').value) || 0; t.stats.for = parseInt($('fFor').value) || 0; t.stats.int = parseInt($('fInt').value) || 0; t.stats.pre = parseInt($('fPre').value) || 0; t.stats.vig = parseInt($('fVig').value) || 0;
                    t.stats.def = parseInt($('fDef').value) || 0;
                    if(t.stats.type === 'threat') { t.stats.bloq = $('fBloq').value; t.stats.esq = $('fEsq').value; t.stats.von = $('fVon').value; } else { t.stats.bloq = parseInt($('fBloq').value) || 0; t.stats.esq = parseInt($('fEsq').value) || 0; }
                    t.stats.speed = $('fSpeed').value; t.stats.size = $('fSize').value; t.stats.presDt = parseInt($('fPresDt').value) || 0; t.stats.presDano = $('fPresDano').value; t.stats.presNex = parseInt($('fPresNex').value) || 0; t.stats.enigma = $('fEnigma').value;
                    t.stats.pv = parseInt($('fPvCurr').value) || 0; t.stats.maxPv = parseInt($('fPvMax').value) || 0; t.stats.pe = parseInt($('fPeCurr').value) || 0; t.stats.maxPe = parseInt($('fPeMax').value) || 0; t.stats.san = parseInt($('fSanCurr').value) || 0; t.stats.maxSan = parseInt($('fSanMax').value) || 0; t.stats.pd = parseInt($('fPdCurr').value) || 0; t.stats.maxPd = parseInt($('fPdMax').value) || 0;
                }
                $('peculiaritiesModal').style.display = 'none'; 
            },
            handleRosterContextMenu(e, id) { e.preventDefault(); this.activeCtxToken = id; const token = AppState.tokens.find(t => t.id === id); const locateBtn = $('ctxLocate'); if (token && token.x !== null) locateBtn.classList.remove('disabled'); else locateBtn.classList.add('disabled'); const menu = $('tokenCtxMenu'); menu.style.display = 'flex'; let mx = e.clientX; let my = e.clientY; if (mx + menu.offsetWidth > window.innerWidth) mx = window.innerWidth - menu.offsetWidth - 10; if (my + menu.offsetHeight > window.innerHeight) my = window.innerHeight - menu.offsetHeight - 10; menu.style.left = mx + 'px'; menu.style.top = my + 'px'; },
            promptDelete() { $('tokenCtxMenu').style.display = 'none'; $('deleteConfirmModal').style.display = 'flex'; },
            confirmDelete() { const idx = AppState.tokens.findIndex(t => t.id === this.activeCtxToken); if (idx > -1) { const token = AppState.tokens[idx]; const mapEl = $(`token-map-${token.id}`); if(mapEl) mapEl.remove(); AppState.tokens.splice(idx, 1); if(AppState.initiative) { AppState.initiative = AppState.initiative.filter(i => i.tokenId !== token.id); if(typeof initSystem !== 'undefined') { initSystem.render(); $('turnsPerRound').value = AppState.initiative.length > 0 ? AppState.initiative.length : 10; } } this.renderRoster(); } $('deleteConfirmModal').style.display = 'none'; },
            locateActiveToken() { if(this.activeCtxToken) this.centerOnToken(this.activeCtxToken); $('tokenCtxMenu').style.display = 'none'; },
            editActiveToken() { if(this.activeCtxToken) this.openModal(true); },
            duplicateActiveToken() { const t = AppState.tokens.find(tok => tok.id === this.activeCtxToken); if(t) { const newToken = { ...t, id: generateId(), x: null, y: null, conditions: JSON.parse(JSON.stringify(t.conditions || [])) }; AppState.tokens.push(newToken); this.renderRoster(); } $('tokenCtxMenu').style.display = 'none'; },
            renderRoster() { const container = $('tokenRoster'); container.innerHTML = ''; AppState.tokens.forEach(t => { const el = document.createElement('div'); el.className = 'token-ui'; el.style.borderColor = t.colorBorder; el.style.color = t.colorText; el.style.backgroundColor = t.colorFill; el.innerText = t.name; el.title = t.fullName; el.draggable = true; if (t.x !== null) { el.classList.add('on-map'); el.onclick = () => this.centerOnToken(t.id); } el.ondragstart = (e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "copyMove"; }; el.oncontextmenu = (e) => this.handleRosterContextMenu(e, t.id); container.appendChild(el); }); },
            placeTokenOnMap(id, x, y) { 
                const token = AppState.tokens.find(t => t.id === id); if (!token) return; token.x = x; token.y = y; 
                const existingEl = $(`token-map-${id}`); if (existingEl) existingEl.remove(); 
                const el = document.createElement('div'); el.className = 'token-map'; el.id = `token-map-${id}`; el.style.borderColor = token.colorBorder; el.style.backgroundColor = token.colorFill; el.style.color = token.colorText; el.style.textShadow = '0 1px 2px black'; el.innerText = token.name; el.style.left = x + 'px'; el.style.top = y + 'px'; 
                let isDragging = false; 
                const moveHandler = (e) => { const pos = mapSystem.getMousePosInMap(e); el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; token.x = pos.x; token.y = pos.y; }; 
                const upHandler = () => { isDragging = false; el.style.cursor = 'grab'; window.removeEventListener('mousemove', moveHandler); window.removeEventListener('mouseup', upHandler); }; 
                el.onmousedown = (e) => { if (e.button !== 0) return; e.stopPropagation(); isDragging = true; el.style.cursor = 'grabbing'; window.addEventListener('mousemove', moveHandler); window.addEventListener('mouseup', upHandler); }; 
                el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); token.x = null; token.y = null; el.remove(); this.renderRoster(); }; 
                el.ondblclick = (e) => { e.stopPropagation(); tokenManager.showPeculiarities(token.id, true); }; 
                mapSystem.container.appendChild(el); this.renderRoster(); 
            },
            centerOnToken(id) { const token = AppState.tokens.find(t => t.id === id); if (token && token.x !== null) { mapSystem.currentX = (mapSystem.viewport.clientWidth / 2) - (token.x * mapSystem.scale); mapSystem.currentY = (mapSystem.viewport.clientHeight / 2) - (token.y * mapSystem.scale); mapSystem.updateTransform(); } }
        };
        
        const timeSystem = { 
            updateUI() { $('valRound').innerText = AppState.round; $('valTurn').innerText = AppState.turn; $('valScene').innerText = AppState.scene; }, 
            addTurn() { 
                let maxTurns = parseInt($('turnsPerRound').value) || 10; 
                if (AppState.initiative && AppState.initiative.length > 0) { maxTurns = AppState.initiative.length; $('turnsPerRound').value = maxTurns; }
                AppState.turn++; 
                if (AppState.turn > maxTurns) { 
                    AppState.turn = 1; AppState.round++; this.triggerRoundBlink(); urgencySystem.tickRound(); 
                } 
                this.updateUI(); if(typeof initSystem !== 'undefined') initSystem.render(); 
            }, 
            nextScene() { 
                if(confirm("Iniciar próxima cena?")) { 
                    AppState.scene++; AppState.round = 1; AppState.turn = 1; 
                    AppState.urgency = null; urgencySystem.updateUI();
                    this.updateUI(); if(typeof initSystem !== 'undefined') initSystem.render(); 
                } 
            },
            triggerRoundBlink() { const footer = $('footerBar'); footer.classList.add('round-blink'); setTimeout(() => footer.classList.remove('round-blink'), 1200); }
        };
        
        window.onload = () => { mapSystem.init(); ui.updatePresetSelect(); urgencySystem.updateUI(); tutorialSystem.init(); };