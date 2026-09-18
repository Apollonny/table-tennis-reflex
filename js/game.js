





class TableTennisGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.physics = new TableTennisPhysics();
        this.renderer = new TableTennisRenderer(this.container);
        this.audio = window.soundEngine;
        this.controller = new TableTennisController(this.renderer.renderer.domElement, this.physics, this.renderer, this.audio);
        this.ai = new TableTennisAI(this.physics, this.renderer, this.audio);

        window.gameInstance = this;
        window.playerController = this.controller;


        this.playerScore = 0;
        this.opponentScore = 0;
        this.targetPoints = 11;
        this.trophies = 0;
        this.servingSide = 'player';
        this.serveCount = 0;
        this.isServe = true;
        this.rallyCount = 0;
        this.state = 'ready';
        this.prevState = 'serving';
        this.lastMatchWinner = null;


        this.opponentServeTimeout = null;
        this.nextPointTimeout = null;
        this.netReplayTimeout = null;
        this.calloutTimer = null;
        this.pendingServeReplay = false;
        this.serveTouchedNet = false;
        this.scoreFlipTimers = new Map();


        this.gameMode = this.safeStorageGet('tt_game_mode', 'arcade');
        if (this.gameMode !== 'tournament') this.gameMode = 'arcade';



        this.physicsProfile = this.physics.setProfile('pro');
        this.profileChangeRequiresServeReset = false;
        try { localStorage.removeItem('tt_physics_profile'); } catch (e) {}


        this.proCoachEnabled = this.safeStorageGet('tt_pro_coach', 'on') !== 'off';
        this.proCoachStats = { in: 0, net: 0, out: 0 };
        this.matchMaxRally = 0;
        this.proMatchStats = {
            shots: 0,
            contactSum: 0,
            qualitySum: 0,
            maxSpeed: 0,
            maxSpin: 0,
            serves: 0,
            legalServes: 0,
            aces: 0,
            maxRally: 0
        };
        this.lastPlayerTechnique = null;
        this.lastProServePlan = null;


        this.arcadeCombo = 0;
        this.arcadeMaxCombo = 0;
        this.arcadeMomentum = 0;
        this.arcadePerfectHits = 0;
        this.arcadeSuperSmashes = 0;
        this.arcadePointsWon = 0;
        this.arcadePointsLost = 0;
        this.arcadeSmashWinners = 0;
        this.arcadeClutchSaves = 0;
        this.arcadeComebackMaxDeficit = 0;
        this.arcadeComebackTriggered = false;
        this.arcadeHitStopUntil = 0;
        this.arcadePerfectServes = 0;
        this.arcadeAces = 0;
        this.arcadeCurveShots = 0;
        this.arcadeDropShots = 0;
        this.lastArcadeServePlan = null;
        this.arcadeImpactTimer = null;
        this.arcadeSpecialSelection = this.safeStorageGet('tt_arcade_special', 'super');
        if (!['super', 'curve', 'drop'].includes(this.arcadeSpecialSelection)) this.arcadeSpecialSelection = 'super';

        this.tournament = new TableTennisTournament();
        this.trophies = (this.tournament && typeof this.tournament.getCareerStats === 'function'
            ? this.tournament.getCareerStats().trophies
            : (this.tournament && this.tournament.careerTrophies)) || 0;
        this.tempSelectedCountry = this.tournament.playerCountry;
        this.playerCountry = { code: 'player', name: 'SEN', flag: 'assets/avatar_player.png' };
        this.opponentCountry = { code: 'enemy', name: 'AI RAKİP', flag: 'assets/avatar_enemy.png' };


        this.initUI();


        this.setupPhysicsHooks();


        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);


        this.prepareServe();
    }

    safeStorageGet(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    initUI() {
        this.elScorePlayer = document.getElementById('score-player');
        this.elScoreOpponent = document.getElementById('score-opponent');
        this.elTrophyCount = document.getElementById('trophy-count');
        if (this.elTrophyCount) this.elTrophyCount.textContent = this.trophies;
        this.elCallout = document.getElementById('game-callout');
        this.elServeIndicator = document.getElementById('serve-indicator');
        this.elPauseModal = document.getElementById('pause-modal');
        this.elGameOverModal = document.getElementById('game-over-modal');
        this.elRallyContainer = document.getElementById('rally-counter');
        this.elRallyNum = document.getElementById('rally-count-num');
        this.elRallyLabel = document.getElementById('rally-count-label');
        this.elTechniqueHud = document.getElementById('pro-technique-hud');
        this.elTechniqueGrade = document.getElementById('tech-hud-grade');
        this.elTechniqueStroke = document.getElementById('tech-hud-stroke');
        this.elTechniqueSpeed = document.getElementById('tech-hud-speed');
        this.elTechniqueContact = document.getElementById('tech-hud-contact');
        this.elTechniqueFace = document.getElementById('tech-hud-face');
        this.elTechniqueSpinX = document.getElementById('tech-hud-spin-x');
        this.elTechniqueSpinY = document.getElementById('tech-hud-spin-y');
        this.elTechniqueFeedback = document.getElementById('tech-hud-feedback');
        this.elArcadeFlowHud = document.getElementById('arcade-flow-hud');
        this.elArcadeCombo = document.getElementById('arcade-combo-num');
        this.elArcadeMomentumValue = document.getElementById('arcade-momentum-value');
        this.elArcadeMomentumFill = document.getElementById('arcade-momentum-fill');
        this.elArcadeMomentumStatus = document.getElementById('arcade-momentum-status');
        this.elArcadeSpecialStrip = document.getElementById('arcade-special-strip');
        this.elArcadeServeAimHud = document.getElementById('arcade-serve-aim-hud');
        this.elArcadeServeAimLabel = document.getElementById('serve-aim-label');
        this.elArcadeServeAimZone = document.getElementById('arcade-serve-aim-zone');
        this.elArcadeServeAimSpin = document.getElementById('arcade-serve-aim-spin');
        this.elArcadeImpact = document.getElementById('arcade-impact-flash');
        this.elArcadeReport = document.getElementById('arcade-performance-report');
        this.elArcadeReportGrade = document.getElementById('arcade-report-grade');
        this.elArcadeReportScore = document.getElementById('arcade-report-score');
        this.elArcadeReportCombo = document.getElementById('arcade-report-combo');
        this.elArcadeReportPerfect = document.getElementById('arcade-report-perfect');
        this.elArcadeReportSuper = document.getElementById('arcade-report-super');
        this.elArcadeReportClutch = document.getElementById('arcade-report-clutch');
        this.elProReport = document.getElementById('pro-performance-report');
        this.elProReportAccuracy = document.getElementById('pro-report-accuracy');
        this.elProReportContact = document.getElementById('pro-report-contact');
        this.elProReportSpeed = document.getElementById('pro-report-speed');
        this.elProReportSpin = document.getElementById('pro-report-spin');
        this.elProReportServe = document.getElementById('pro-report-serve');
        this.elProReportAces = document.getElementById('pro-report-aces');
        this.elProReportRally = document.getElementById('pro-report-rally');


        document.getElementById('btn-home')?.addEventListener('click', () => this.resetMatch());
        document.getElementById('btn-sound')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('fullscreen-hint')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());


        this.updateSoundUI();


        document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btn-modal-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.resetMatch();
        });
        document.getElementById('btn-rematch')?.addEventListener('click', () => {
            this.elGameOverModal.classList.add('hidden');
            if (this.tournament && this.gameMode === 'tournament') {


                if (this.lastMatchWinner === 'player') {
                    this.openBracketModal();
                    return;
                }
                const totalStages = this.tournament.stages ? this.tournament.stages.length : 3;
                if (this.tournament.currentStageIndex >= totalStages) {
                    this.openCountryModal();
                    return;
                }
                this.tournament.retryCurrentStage();
                this.applyTournamentMatch();
                this.renderBracket();
            }
            this.resetMatch();
        });


        const savedDiff = this.safeStorageGet('tt_difficulty', 'medium');
        this.setDifficulty(savedDiff, false);


        this.setPhysicsProfile(this.physicsProfile, false);
        document.getElementById('btn-pro-coach')?.addEventListener('click', () => {
            if (this.physicsProfile !== 'pro') return;
            this.setProCoachEnabled(!this.proCoachEnabled, true);
        });
        this.updateProCoachUI();


        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diff = e.currentTarget.dataset.diff;
                this.setDifficulty(diff, true);
            });
        });


        const topLangSelect = document.getElementById('lang-select-top');
        if (topLangSelect) {
            topLangSelect.value = window.i18n ? window.i18n.currentLanguage : 'en';
            topLangSelect.addEventListener('change', (e) => {
                if (window.i18n) window.i18n.setLanguage(e.target.value);
            });
        }

        document.querySelectorAll('.lang-pill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (window.i18n) window.i18n.setLanguage(lang);
            });
        });


        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
            document.addEventListener(evt, () => this.updateFullscreenUI());
        });


        window.addEventListener('languagechange', (e) => {
            const lang = (e.detail && e.detail.lang) || (window.i18n ? window.i18n.currentLanguage : 'tr');
            this.updateLanguageUI(lang);
            this.updateArcadeServeAim();
        });


        window.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            } else if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            } else if (e.key === 'Escape') {
                const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
                if (!isFs) {
                    if (this.elScoutingModal && !this.elScoutingModal.classList.contains('hidden')) {
                        this.closeScoutingModal();
                        return;
                    }
                    if (this.elCareerModal && !this.elCareerModal.classList.contains('hidden')) {
                        this.closeCareerStatsModal();
                        return;
                    }
                    if (this.elCountryModal && !this.elCountryModal.classList.contains('hidden')) {
                        this.closeCountryModal();
                        return;
                    }
                    if (this.elBracketModal && !this.elBracketModal.classList.contains('hidden')) {
                        this.closeBracketModal();
                        return;
                    }
                    this.togglePause();
                }
            }
        });


        this.updateFullscreenUI();
        if (window.i18n) {
            this.updateLanguageUI(window.i18n.currentLanguage);
        }


        this.initTournamentUI();
    }

    initTournamentUI() {
        this.elTournamentBadge = document.getElementById('btn-tournament');
        this.elCountryModal = document.getElementById('country-select-modal');
        this.elBracketModal = document.getElementById('tournament-bracket-modal');
        this.elBtnTournamentAdvance = document.getElementById('btn-tournament-advance');


        document.getElementById('btn-mode-arcade')?.addEventListener('click', () => {
            if (this.elPauseModal) this.elPauseModal.classList.add('hidden');
            if (this.gameMode === 'tournament') {
                this.setGameMode('arcade');
            } else {
                this.resumeGame();
            }
        });
        document.getElementById('btn-mode-tournament')?.addEventListener('click', () => {
            if (this.elPauseModal) this.elPauseModal.classList.add('hidden');
            if (this.gameMode === 'tournament') {
                this.openBracketModal();
            } else {
                this.openCountryModal();
            }
        });
        document.getElementById('btn-exit-to-arcade')?.addEventListener('click', () => {
            this.elBracketModal?.classList.add('hidden');
            this.setGameMode('arcade');
            this.resumeGame();
        });


        this.elTournamentBadge?.addEventListener('click', () => {
            if (this.gameMode !== 'tournament') {

                this.openCountryModal();
            } else {

                this.setGameMode('arcade');
                const exitMsg = window.i18n ? window.i18n.t('callout_tournament_left') : 'TURNUVADAN ÇIKILDI ➔ AI FIGHT AKTİF ⚔️';
                this.showCallout(exitMsg, '#ffc83b', 1400);
            }
        });

        document.getElementById('btn-pause-bracket')?.addEventListener('click', () => {
            if (this.elPauseModal) this.elPauseModal.classList.add('hidden');
            this.openBracketModal();
        });


        this.selectedTournamentType = 'masters';
        const btnTourneyMasters = document.getElementById('btn-tourney-masters');
        const btnTourneyWorld = document.getElementById('btn-tourney-world');
        btnTourneyMasters?.addEventListener('click', () => {
            this.selectedTournamentType = 'masters';
            btnTourneyMasters.classList.add('active');
            btnTourneyWorld?.classList.remove('active');
            this.renderCountryGrid();
        });
        btnTourneyWorld?.addEventListener('click', () => {
            this.selectedTournamentType = 'world';
            btnTourneyWorld.classList.add('active');
            btnTourneyMasters?.classList.remove('active');
            this.renderCountryGrid();
        });


        this.selectedTourneyDifficulty = (this.tournament && this.tournament.difficulty) || 'medium';
        const tourneyDiffButtons = document.querySelectorAll('#tourney-diff-selector .tourney-diff-btn');
        tourneyDiffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.tourneyDiff;
                if (['easy', 'medium', 'hard'].includes(diff)) {
                    this.selectedTourneyDifficulty = diff;
                    tourneyDiffButtons.forEach(b => b.classList.toggle('active', b.dataset.tourneyDiff === diff));
                    if (this.audio) this.audio.play('hit', 0, 1.1);
                }
            });
        });


        this.elScoutingModal = document.getElementById('opponent-scouting-modal');
        document.getElementById('btn-scouting-close')?.addEventListener('click', () => this.closeScoutingModal());
        document.getElementById('btn-scouting-back')?.addEventListener('click', () => {
            this.closeScoutingModal();
            this.openBracketModal();
        });
        document.getElementById('btn-scouting-play')?.addEventListener('click', () => {
            this.closeScoutingModal();
            this.resetMatch();
        });
        document.getElementById('btn-scout-upcoming')?.addEventListener('click', () => {
            this.elBracketModal?.classList.add('hidden');
            const opp = this.tournament ? this.tournament.getCurrentOpponent() : null;
            if (opp) {
                this.openScoutingModal(opp.code);
            }
        });


        this.elCareerModal = document.getElementById('career-stats-modal');
        document.getElementById('hud-trophy')?.addEventListener('click', () => this.openCareerStatsModal());
        document.getElementById('btn-career-close')?.addEventListener('click', () => this.closeCareerStatsModal());
        document.getElementById('btn-career-modal-close')?.addEventListener('click', () => this.closeCareerStatsModal());


        document.getElementById('btn-country-close')?.addEventListener('click', () => this.closeCountryModal());
        document.getElementById('btn-country-modal-close')?.addEventListener('click', () => this.closeCountryModal());

        document.getElementById('btn-confirm-country')?.addEventListener('click', () => {

            const chosenCountry = this.tempSelectedCountry || (this.tournament ? this.tournament.playerCountry : 'tr') || 'tr';
            const chosenFormat = this.selectedTournamentType || 'masters';
            const chosenDiff = this.selectedTourneyDifficulty || (this.tournament ? this.tournament.difficulty : 'medium') || 'medium';
            this.tournament.startNewTournament(chosenCountry, chosenFormat, chosenDiff);
            try { localStorage.setItem('tt_career_country_chosen', '1'); } catch(e) {}
            this.elCountryModal?.classList.add('hidden');

            this.gameMode = 'tournament';
            try { localStorage.setItem('tt_game_mode', 'tournament'); } catch(e) {}
            this.applyTournamentMatch();
            this.resetMatch();

            const joinMsg = window.i18n ? window.i18n.t('callout_tournament_active') : 'DÜNYA TURNUVASI AKTİF 🌍';
            this.showCallout(joinMsg, '#ffc83b', 1400);


            this.openBracketModal();
        });


        document.getElementById('btn-bracket-close')?.addEventListener('click', () => this.closeBracketModal());
        document.getElementById('btn-change-country')?.addEventListener('click', () => {
            this.elBracketModal?.classList.add('hidden');
            this.openCountryModal();
        });
        document.getElementById('btn-reset-tournament')?.addEventListener('click', () => {
            const format = this.tournament ? this.tournament.tournamentType : 'masters';
            const diff = this.tournament ? this.tournament.difficulty : 'medium';
            this.tournament.startNewTournament(this.tournament.playerCountry, format, diff);
            this.applyTournamentMatch();
            this.renderBracket();
        });
        document.getElementById('btn-bracket-play')?.addEventListener('click', () => {
            this.elBracketModal?.classList.add('hidden');
            const totalStages = this.tournament && this.tournament.stages ? this.tournament.stages.length : 3;
            if (this.tournament && this.tournament.currentStageIndex >= totalStages) {

                this.openCountryModal();
            } else {
                if (this.tournament) {
                    const curMatch = this.tournament.getCurrentMatch();
                    if (curMatch && curMatch.winner) {
                        this.tournament.retryCurrentStage();
                    }
                }
                this.resetMatch();
            }
        });
        this.elBtnTournamentAdvance?.addEventListener('click', () => {
            this.elGameOverModal?.classList.add('hidden');
            this.openBracketModal();
        });

        this.applyTournamentMatch();
        this.renderCountryGrid();
        this.renderBracket();
    }

    closeCountryModal() {
        this.elCountryModal?.classList.add('hidden');
        if (this.gameMode === 'tournament') {
            this.openBracketModal();
        } else {
            this.resumeGame();
        }
    }

    closeBracketModal() {
        this.elBracketModal?.classList.add('hidden');



        if (this.state === 'match_end') {
            this.elGameOverModal?.classList.remove('hidden');
            return;
        }
        this.resumeGame();
    }

    openScoutingModal(countryCode) {
        if (!this.tournament || !this.elScoutingModal) return;
        const report = this.tournament.getScoutingReport(countryCode);
        if (!report) return;

        const flagEl = document.getElementById('scout-flag');
        const nameEl = document.getElementById('scout-opp-name');
        const styleEl = document.getElementById('scout-opp-style');
        const archEl = document.getElementById('scout-arch-badge');
        const ratingEl = document.getElementById('scout-rating-badge');

        const barSpeed = document.getElementById('scout-bar-speed');
        const valSpeed = document.getElementById('scout-val-speed');
        const barSpin = document.getElementById('scout-bar-spin');
        const valSpin = document.getElementById('scout-val-spin');
        const barPower = document.getElementById('scout-bar-power');
        const valPower = document.getElementById('scout-val-power');
        const barDef = document.getElementById('scout-bar-defense');
        const valDef = document.getElementById('scout-val-defense');

        const strengthsList = document.getElementById('scout-strengths-list');
        const weaknessesList = document.getElementById('scout-weaknesses-list');
        const coachTip = document.getElementById('scout-coach-tip');

        const localizedName = window.i18n ? window.i18n.getCountryName(countryCode) : report.name;
        const localizedStyle = window.i18n ? window.i18n.getCountryStyle(countryCode) : report.style;
        const localizedArch = window.i18n ? window.i18n.getArchetypeName(report.archetype) : report.archetype;

        if (flagEl) flagEl.src = report.flag;
        if (nameEl) nameEl.textContent = localizedName;
        if (styleEl) styleEl.textContent = localizedStyle;
        if (archEl) archEl.textContent = localizedArch;
        if (ratingEl) ratingEl.textContent = report.rating;

        if (barSpeed) barSpeed.style.width = `${report.ratings.speed}%`;
        if (valSpeed) valSpeed.textContent = report.ratings.speed;
        if (barSpin) barSpin.style.width = `${report.ratings.spin}%`;
        if (valSpin) valSpin.textContent = report.ratings.spin;
        if (barPower) barPower.style.width = `${report.ratings.power}%`;
        if (valPower) valPower.textContent = report.ratings.power;
        if (barDef) barDef.style.width = `${report.ratings.defense}%`;
        if (valDef) valDef.textContent = report.ratings.defense;

        if (strengthsList) {
            strengthsList.innerHTML = report.strengths.map(s => `<li>${s}</li>`).join('');
        }
        if (weaknessesList) {
            weaknessesList.innerHTML = report.weaknesses.map(w => `<li>${w}</li>`).join('');
        }
        if (coachTip) {
            coachTip.textContent = report.tip;
        }

        this.pauseGame(false);
        this.elScoutingModal.classList.remove('hidden');
    }

    closeScoutingModal() {
        this.elScoutingModal?.classList.add('hidden');
        if (this.gameMode === 'tournament') {
            this.openBracketModal();
        } else {
            this.resumeGame();
        }
    }

    openCareerStatsModal() {
        if (!this.elCareerModal || !this.tournament) return;
        const stats = this.tournament.getCareerStats();
        this.trophies = stats.trophies;
        if (this.elTrophyCount) this.elTrophyCount.textContent = this.trophies;

        const careerPill = document.querySelector('.career-stage-pill');
        if (careerPill) {
            const title = window.i18n ? window.i18n.t('career_title') : 'CAREER RECORD';
            careerPill.innerHTML = `📊 <span data-i18n="career_title">${title}</span>`;
        }

        const trEl = document.getElementById('stat-trophies-num');
        const trGridEl = document.getElementById('stat-trophies-grid-num') || document.getElementById('stat-points-num');
        const mtEl = document.getElementById('stat-matches-num');
        const wnEl = document.getElementById('stat-wins-num');
        const lsEl = document.getElementById('stat-losses-num');
        const wrEl = document.getElementById('stat-winrate-num');
        const ptEl = document.getElementById('stat-points-num');
        const rlEl = document.getElementById('stat-rally-num');

        if (trEl) trEl.textContent = stats.trophies;
        if (trGridEl) trGridEl.textContent = stats.trophies;
        if (mtEl) mtEl.textContent = stats.matchesPlayed;
        if (wnEl) wnEl.textContent = stats.matchesWon;
        if (lsEl) lsEl.textContent = stats.matchesLost;
        if (wrEl) wrEl.textContent = `${stats.winRate}%`;
        if (ptEl && ptEl !== trGridEl) ptEl.textContent = stats.totalPointsScored;
        if (rlEl) rlEl.textContent = stats.highestRally;

        this.pauseGame(false);
        this.elCareerModal.classList.remove('hidden');
    }

    closeCareerStatsModal() {
        this.elCareerModal?.classList.add('hidden');
        this.resumeGame();
    }

    setGameMode(mode) {
        this.gameMode = mode === 'tournament' ? 'tournament' : 'arcade';
        try { localStorage.setItem('tt_game_mode', this.gameMode); } catch(e) {}
        this.applyTournamentMatch();
        this.resetMatch();

        if (this.gameMode === 'tournament') {
            const msg = window.i18n ? window.i18n.t('callout_tournament_active') : 'DÜNYA TURNUVASI AKTİF 🌍';
            this.showCallout(msg, '#ffc83b', 1400);
        } else {
            this.elBracketModal?.classList.add('hidden');
            this.elCountryModal?.classList.add('hidden');
            const msg = window.i18n ? window.i18n.t('callout_arcade_active') : 'AI FIGHT (NORMAL MOD) AKTİF ⚔️';
            this.showCallout(msg, '#00e5ff', 1200);
        }
    }

    openCountryModal() {
        this.pauseGame(false);
        this.elPauseModal?.classList.add('hidden');
        this.tempSelectedCountry = (this.tournament && this.tournament.playerCountry) ? this.tournament.playerCountry : 'tr';
        const format = (this.tournament && this.tournament.tournamentType) ? this.tournament.tournamentType : 'masters';
        this.selectedTournamentType = format;
        const btnM = document.getElementById('btn-tourney-masters');
        const btnW = document.getElementById('btn-tourney-world');
        if (format === 'world') {
            btnW?.classList.add('active');
            btnM?.classList.remove('active');
        } else {
            btnM?.classList.add('active');
            btnW?.classList.remove('active');
        }

        const savedTourneyDiff = (this.tournament && this.tournament.difficulty) || 'medium';
        this.selectedTourneyDifficulty = savedTourneyDiff;
        document.querySelectorAll('#tourney-diff-selector .tourney-diff-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tourneyDiff === savedTourneyDiff);
        });

        this.renderCountryGrid();
        this.elCountryModal?.classList.remove('hidden');
    }

    openBracketModal() {
        this.pauseGame(false);
        this.elPauseModal?.classList.add('hidden');
        this.renderBracket();
        this.elBracketModal?.classList.remove('hidden');
    }

    applyTournamentMatch() {
        let p, opp;

        if (this.gameMode === 'tournament') {
            p = this.tournament.getPlayerCountry();
            opp = this.tournament.getCurrentOpponent();
        } else {

            p = {
                code: 'player',
                name: window.i18n ? window.i18n.t('player_label') : 'SEN',
                flag: 'assets/avatar_player.png'
            };
            opp = {
                code: 'enemy',
                name: window.i18n ? (window.i18n.t('enemy_label') || 'AI RAKİP') : 'AI RAKİP',
                flag: 'assets/avatar_enemy.png'
            };
        }

        this.playerCountry = p;
        this.opponentCountry = opp;

        let pName, oppName;
        if (this.gameMode === 'tournament') {
            pName = window.i18n ? window.i18n.getCountryName(p.code) : p.name;
            oppName = window.i18n ? window.i18n.getCountryName(opp.code) : opp.name;
        } else {
            pName = window.i18n ? window.i18n.t('player_label') : p.name;
            oppName = window.i18n ? (window.i18n.t('enemy_label') || opp.name) : opp.name;
        }

        const pFlag = document.getElementById('flag-player-img');
        const oFlag = document.getElementById('flag-opponent-img');
        const pBox = document.getElementById('flag-player-box');
        const oBox = document.getElementById('flag-opponent-box');
        if (pFlag) pFlag.src = p.flag;
        if (oFlag) oFlag.src = opp.flag;
        if (pBox) pBox.title = pName;
        if (oBox) oBox.title = oppName;

        const pauseFlagP = document.getElementById('pause-flag-player');
        const pauseFlagO = document.getElementById('pause-flag-opponent');
        if (pauseFlagP) pauseFlagP.src = p.flag;
        if (pauseFlagO) pauseFlagO.src = opp.flag;
        const pauseFlags = document.querySelectorAll('.pause-score-flag img');
        if (pauseFlags[0] && !pauseFlagP) pauseFlags[0].src = p.flag;
        if (pauseFlags[1] && !pauseFlagO) pauseFlags[1].src = opp.flag;

        const goPlayerFlag = document.getElementById('go-flag-player');
        const goOppFlag = document.getElementById('go-flag-opponent');
        const goPlayerTeam = document.getElementById('go-team-player');
        const goOppTeam = document.getElementById('go-team-opponent');
        if (goPlayerFlag) goPlayerFlag.src = p.flag;
        if (goOppFlag) goOppFlag.src = opp.flag;
        if (goPlayerTeam) goPlayerTeam.textContent = pName.toUpperCase();
        if (goOppTeam) goOppTeam.textContent = oppName.toUpperCase();


        const btnModeArcade = document.getElementById('btn-mode-arcade');
        const btnModeTourney = document.getElementById('btn-mode-tournament');
        const stageLbl = document.getElementById('tournament-stage-lbl');
        const stageIcon = document.getElementById('tournament-stage-icon');
        const stageBtn = document.getElementById('btn-tournament');
        const stagePill = document.getElementById('bracket-stage-pill');
        const pauseBracketBtn = document.getElementById('btn-pause-bracket');

        if (this.gameMode === 'tournament') {
            btnModeArcade?.classList.remove('active');
            btnModeTourney?.classList.add('active');


            if (stageIcon) stageIcon.textContent = '🚪';
            if (stageLbl) stageLbl.textContent = window.i18n ? window.i18n.t('btn_leave_tournament') : 'TURNUVADAN ÇIK';
            if (stageBtn) {
                stageBtn.classList.add('in-tournament');
                stageBtn.title = window.i18n ? window.i18n.t('tournament_leave_title') : 'Turnuvadan Çık (AI Fight\'a Dön)';
            }
            if (pauseBracketBtn) {
                pauseBracketBtn.classList.remove('hidden');
            }

            const stage = this.tournament.getCurrentStage();
            const baseDiff = (this.tournament && this.tournament.difficulty) ? this.tournament.difficulty : 'medium';
            this.setDifficulty(baseDiff, false, true);


            if (this.ai && opp) {
                const mods = this.tournament.getAiModifiers(opp.code);
                this.ai.applyTournamentCountryCalibration(baseDiff, opp, mods);
            }

            const localizedStageName = (window.i18n ? window.i18n.t(stage.nameKey) : stage.nameFallback) || stage.nameFallback;
            if (stagePill) {
                stagePill.textContent = `🌍 ${localizedStageName}`;
            }
        } else {

            btnModeArcade?.classList.add('active');
            btnModeTourney?.classList.remove('active');


            if (this.ai) {
                this.ai.setArchetype(null);
            }


            if (stageIcon) stageIcon.textContent = '🌍';
            if (stageLbl) stageLbl.textContent = window.i18n ? window.i18n.t('mode_tournament') : 'TURNUVA';
            if (stageBtn) {
                stageBtn.classList.remove('in-tournament');
                stageBtn.title = window.i18n ? window.i18n.t('tournament_join_title') : 'Dünya Turnuvası\'na Katıl';
            }
            if (pauseBracketBtn) {
                pauseBracketBtn.classList.add('hidden');
            }


            const savedDiff = this.safeStorageGet('tt_difficulty', 'medium');
            this.setDifficulty(savedDiff, false);
        }
    }

    setPhysicsProfile(_profile = 'pro', showFeedback = false) {


        this.physicsProfile = 'pro';
        if (this.physics && typeof this.physics.setProfile === 'function') this.physics.setProfile('pro');
        this.profileChangeRequiresServeReset = false;
        try { localStorage.removeItem('tt_physics_profile'); } catch (e) {}
        this.updatePhysicsProfileUI();
        this.updateProCoachUI();

        if (showFeedback) {
            const msg = window.i18n ? window.i18n.t('physics_pro_selected') : 'PRO FİZİK AKTİF 🎯';
            this.showCallout(msg, '#00e5ff', 1000);
        }
    }

    updatePhysicsProfileUI() {

        const note = document.getElementById('physics-profile-note');
        if (note) {
            const key = 'physics_pro_desc';
            note.setAttribute('data-i18n', key);
            note.textContent = window.i18n ? window.i18n.t(key)
                : 'Stroke-driven spin; racket face angle can create real net and long-out errors.';
        }
    }

    setProCoachEnabled(enabled, showFeedback = false) {
        this.proCoachEnabled = !!enabled;
        try { localStorage.setItem('tt_pro_coach', this.proCoachEnabled ? 'on' : 'off'); } catch (e) {}
        this.updateProCoachUI();

        if (showFeedback) {
            const key = this.proCoachEnabled ? 'coach_on' : 'coach_off';
            const label = window.i18n ? window.i18n.t(key) : (this.proCoachEnabled ? 'ON' : 'OFF');
            this.showCallout(`PRO COACH: ${label}`, this.proCoachEnabled ? '#00e5ff' : '#ffffff', 900);
        }
    }

    updateProCoachUI() {
        const isPro = true;
        const setting = document.getElementById('pro-coach-setting');
        const btn = document.getElementById('btn-pro-coach');
        const btnText = document.getElementById('pro-coach-toggle-text');
        if (setting) setting.classList.toggle('is-disabled', !isPro);
        if (btn) {
            btn.disabled = !isPro;
            btn.classList.toggle('active', isPro && this.proCoachEnabled);
            btn.setAttribute('aria-pressed', (isPro && this.proCoachEnabled) ? 'true' : 'false');
        }
        if (btnText) {
            const key = this.proCoachEnabled ? 'coach_on' : 'coach_off';
            btnText.setAttribute('data-i18n', key);
            btnText.textContent = window.i18n ? window.i18n.t(key) : (this.proCoachEnabled ? 'ON' : 'OFF');
        }

        if (this.elTechniqueHud) {
            this.elTechniqueHud.classList.toggle('hidden', !(isPro && this.proCoachEnabled));
        }
    }

    isArcadeSpecialReady() {
        return this.physicsProfile === 'arcade' && this.arcadeMomentum >= 100;
    }

    getArcadeSpecialMode() {
        if (!this.isArcadeSpecialReady()) return null;
        return ['super', 'curve', 'drop'].includes(this.arcadeSpecialSelection)
            ? this.arcadeSpecialSelection
            : 'super';
    }

    setArcadeSpecialSelection(mode = 'super', persist = true) {
        const normalized = ['super', 'curve', 'drop'].includes(mode) ? mode : 'super';
        this.arcadeSpecialSelection = normalized;
        if (persist) {
            try { localStorage.setItem('tt_arcade_special', normalized); } catch (e) {}
        }
        document.querySelectorAll('.arcade-special-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.special === normalized);
        });
        this.updateArcadeFlowUI();
        return normalized;
    }

    getArcadeServePlan(controller = this.controller) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const pos = controller && (controller.targetPos || controller.pos) ? (controller.targetPos || controller.pos) : { x: 0, z: 1.20 };
        const vel = controller && controller.velocity ? controller.velocity : { x: 0, y: 0, speed: 0 };
        const speed = Math.max(0, Number(vel.speed) || 0);





        const xBase = clamp(-(Number(pos.x) || 0) * 0.52, -0.44, 0.44);
        const xSwipe = clamp(-(Number(vel.x) || 0) / 4200 * 0.08, -0.08, 0.08);
        const targetX = clamp(xBase + xSwipe, -0.50, 0.50);
        const depthNorm = clamp(((Number(pos.z) || 1.20) - 0.68) / 1.32, 0, 1);
        const targetZ = -0.94 - depthNorm * 0.20;

        const right = targetX >= 0;
        const zoneId = `deep-${right ? 'right' : 'left'}`;
        const zoneCenter = { x: right ? 0.32 : -0.32, z: -1.04 };
        const zoneDistance = Math.hypot((targetX - zoneCenter.x) / 0.30, (targetZ - zoneCenter.z) / 0.16);
        const precision = clamp(1 - zoneDistance, 0, 1);
        const deliberateSwing = speed >= 420 && speed <= 1900 && Math.abs(Number(vel.y) || 0) >= 90;
        const perfect = deliberateSwing && precision >= 0.62;
        let sidespin = clamp((Number(vel.x) || 0) / 62, -30, 30);
        if (perfect) sidespin = clamp(sidespin * 1.20, -36, 36);

        return { targetX, targetZ, zoneId, precision, perfect, sidespin, speed };
    }

    getProServePlan(controller = this.controller) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const pos = controller && (controller.targetPos || controller.pos) ? (controller.targetPos || controller.pos) : { x: 0, z: 1.20 };
        const vel = controller && controller.velocity ? controller.velocity : { x: 0, y: 0, speed: 0 };
        const speed = Math.max(0, Number(vel.speed) || 0);



        const targetX = clamp(-(Number(pos.x) || 0) * 0.58 - (Number(vel.x) || 0) / 4200 * 0.07, -0.50, 0.50);
        const depthNorm = clamp(((Number(pos.z) || 1.20) - 0.68) / 1.32, 0, 1);
        const targetZ = -0.92 - depthNorm * 0.24;
        const right = targetX >= 0;
        const zoneId = `deep-${right ? 'right' : 'left'}`;
        const zoneCenter = { x: right ? 0.34 : -0.34, z: -1.04 };
        const zoneDistance = Math.hypot((targetX - zoneCenter.x) / 0.31, (targetZ - zoneCenter.z) / 0.18);
        const precision = clamp(1 - zoneDistance, 0, 1);



        const spinX = clamp(-(Number(vel.y) || 0) / 18, -85, 110);
        const sidespin = clamp((Number(vel.x) || 0) / 45, -48, 48);
        return { targetX, targetZ, zoneId, precision, spinX, sidespin, speed };
    }

    updateArcadeServeAim() {
        const active = this.state === 'serving' && this.servingSide === 'player';
        if (!active) {
            if (this.renderer && typeof this.renderer.setArcadeServeAim === 'function') {
                this.renderer.setArcadeServeAim(0, -0.92, false);
            }
            if (this.elArcadeServeAimHud) this.elArcadeServeAimHud.classList.add('hidden');
            return null;
        }

        const isPro = this.physicsProfile === 'pro';
        const plan = isPro ? this.getProServePlan() : this.getArcadeServePlan();
        if (this.renderer && typeof this.renderer.setArcadeServeAim === 'function') {
            this.renderer.setArcadeServeAim(plan.targetX, plan.targetZ, true, plan.zoneId, !isPro && !!plan.perfect, isPro ? 'pro' : 'arcade');
        }
        if (this.elArcadeServeAimHud) {
            this.elArcadeServeAimHud.classList.remove('hidden');
            this.elArcadeServeAimHud.classList.toggle('pro-serve-aim', isPro);
        }
        if (this.elArcadeServeAimLabel) {
            const key = isPro ? 'pro_serve_aim' : 'arcade_serve_aim';
            this.elArcadeServeAimLabel.setAttribute('data-i18n', key);
            this.elArcadeServeAimLabel.textContent = window.i18n ? window.i18n.t(key) : (isPro ? 'PRO SERVE TARGET' : 'SERVE TARGET');
        }
        if (this.elArcadeServeAimZone) {
            const zoneKey = `arcade_serve_${plan.zoneId.replace('-', '_')}`;
            this.elArcadeServeAimZone.textContent = window.i18n ? window.i18n.t(zoneKey) : plan.zoneId.toUpperCase();
        }
        if (this.elArcadeServeAimSpin) {
            if (isPro) {
                const sx = Math.round(plan.spinX || 0);
                const sy = Math.round(plan.sidespin || 0);
                const signed = (n) => `${n > 0 ? '+' : ''}${n}`;
                this.elArcadeServeAimSpin.textContent = `T${signed(sx)} · S${signed(sy)}`;
            } else {
                const spin = Math.round(plan.sidespin);
                const spinText = Math.abs(spin) < 5 ? '0' : `${spin > 0 ? '+' : ''}${spin}`;
                this.elArcadeServeAimSpin.textContent = plan.perfect ? `★ ${spinText}` : spinText;
            }
        }
        this.elArcadeServeAimHud?.classList.toggle('perfect-serve-ready', !isPro && !!plan.perfect);
        return plan;
    }

    recordProServe(plan) {
        if (!plan || this.physicsProfile !== 'pro') return;
        this.lastProServePlan = { ...plan, legalRecorded: false };
        this.proMatchStats.serves += 1;
        this.proMatchStats.maxSpin = Math.max(
            this.proMatchStats.maxSpin || 0,
            Math.abs(plan.spinX || 0),
            Math.abs(plan.sidespin || 0)
        );
    }

    recordProServeLegal() {
        if (this.physicsProfile !== 'pro' || !this.lastProServePlan || this.lastProServePlan.legalRecorded) return;
        this.lastProServePlan.legalRecorded = true;
        this.proMatchStats.legalServes += 1;
    }

    cancelProServeAttempt() {
        if (this.physicsProfile !== 'pro' || !this.lastProServePlan) return;
        if (this.lastProServePlan.legalRecorded || this.lastProServePlan.cancelled) return;
        this.lastProServePlan.cancelled = true;
        this.proMatchStats.serves = Math.max(0, (this.proMatchStats.serves || 0) - 1);
    }

    recordArcadeServe(plan) {
        if (!plan || this.physicsProfile !== 'arcade') return;
        this.lastArcadeServePlan = { ...plan };
        if (plan.perfect) {
            this.arcadePerfectServes += 1;
            this.arcadeMomentum = Math.min(100, this.arcadeMomentum + 10);
            const msg = window.i18n ? window.i18n.t('arcade_perfect_serve') : '✨ PERFECT SERVE!';
            this.showCallout(msg, '#69f0ae', 850);
            this.triggerArcadeImpact('perfect');
        }
        this.updateArcadeFlowUI(true);
    }

    recordArcadeHit(plan, speedKmh = 0) {
        if (!plan || this.physicsProfile !== 'arcade') return;

        this.arcadeCombo += 1;
        this.arcadeMaxCombo = Math.max(this.arcadeMaxCombo, this.arcadeCombo);
        if (plan.perfect) this.arcadePerfectHits += 1;

        if (plan.consumesSpecial || plan.superSmash) {
            if (plan.superSmash) this.arcadeSuperSmashes += 1;
            if (plan.curveShot) this.arcadeCurveShots += 1;
            if (plan.dropShot) this.arcadeDropShots += 1;
            this.arcadeMomentum = 0;
        } else {
            const comboBonus = Math.min(6, Math.floor(Math.max(0, this.arcadeCombo - 1) / 3) * 2);
            const qualityBonus = plan.perfect ? 3 : 0;
            this.arcadeMomentum = Math.min(100, this.arcadeMomentum + (plan.momentumGain || 0) + comboBonus + qualityBonus);
        }

        this.updateArcadeFlowUI(true);
    }

    resetArcadePointFlow(preserveMomentum = true) {
        this.arcadeCombo = 0;
        if (!preserveMomentum) {
            this.arcadeMomentum = 0;
            this.arcadeMaxCombo = 0;
            this.arcadePerfectHits = 0;
            this.arcadeSuperSmashes = 0;
            this.arcadePerfectServes = 0;
            this.arcadeAces = 0;
            this.arcadeCurveShots = 0;
            this.arcadeDropShots = 0;
        }
        this.updateArcadeFlowUI();
    }

    updateArcadeFlowUI(pulse = false) {
        if (!this.elArcadeFlowHud) return;
        const isArcade = this.physicsProfile === 'arcade';
        this.elArcadeFlowHud.classList.toggle('hidden', !isArcade);
        if (!isArcade) return;

        const momentum = Math.max(0, Math.min(100, Math.round(this.arcadeMomentum || 0)));
        if (this.elArcadeCombo) this.elArcadeCombo.textContent = this.arcadeCombo > 0 ? `x${this.arcadeCombo}` : '0';
        if (this.elArcadeMomentumValue) this.elArcadeMomentumValue.textContent = `${momentum}%`;
        if (this.elArcadeMomentumFill) this.elArcadeMomentumFill.style.width = `${momentum}%`;

        const ready = momentum >= 100;
        this.elArcadeFlowHud.classList.toggle('momentum-ready', ready);
        if (pulse) {
            this.elArcadeFlowHud.classList.remove('combo-hot');
            void this.elArcadeFlowHud.offsetWidth;
            this.elArcadeFlowHud.classList.add('combo-hot');
        }

        if (this.elArcadeMomentumStatus) {
            let key = 'arcade_build';
            let fallback = 'BUILD THE RALLY';
            if (ready) {
                const selectionKey = `arcade_special_${this.arcadeSpecialSelection}`;
                const selectedLabel = window.i18n ? window.i18n.t(selectionKey) : this.arcadeSpecialSelection.toUpperCase();
                key = 'arcade_ready';
                fallback = 'SPECIAL READY';
                const baseReady = window.i18n ? window.i18n.t(key) : fallback;
                this.elArcadeMomentumStatus.textContent = `${baseReady} · ${selectedLabel}`;
                this.elArcadeMomentumStatus.setAttribute('data-i18n', '');
            } else if (this.arcadeCombo >= 5) {
                key = 'arcade_hot_streak';
                fallback = 'HOT STREAK';
            }
            if (!ready) {
                this.elArcadeMomentumStatus.setAttribute('data-i18n', key);
                const text = window.i18n ? window.i18n.t(key) : fallback;
                this.elArcadeMomentumStatus.textContent = this.arcadeCombo >= 5
                    ? `${text} x${this.arcadeCombo}`
                    : text;
            }
        }

        if (this.elArcadeSpecialStrip) {
            this.elArcadeSpecialStrip.classList.toggle('special-ready', ready);
            this.elArcadeSpecialStrip.querySelectorAll('.arcade-special-btn').forEach(btn => {
                btn.disabled = !ready;
                btn.classList.toggle('active', btn.dataset.special === this.arcadeSpecialSelection);
            });
        }
    }

    getArcadeFlowSnapshot() {
        return {
            combo: this.arcadeCombo || 0,
            maxCombo: this.arcadeMaxCombo || 0,
            momentum: this.arcadeMomentum || 0,
            perfectHits: this.arcadePerfectHits || 0,
            superSmashes: this.arcadeSuperSmashes || 0,
            perfectServes: this.arcadePerfectServes || 0,
            aces: this.arcadeAces || 0,
            curveShots: this.arcadeCurveShots || 0,
            dropShots: this.arcadeDropShots || 0,
            specialSelection: this.arcadeSpecialSelection,
            ready: this.isArcadeSpecialReady()
        };
    }

    triggerArcadeHitStop(durationMs = 24) {
        if (this.physicsProfile !== 'arcade') return;
        const duration = Math.max(0, Math.min(90, Number(durationMs) || 0));
        this.arcadeHitStopUntil = Math.max(this.arcadeHitStopUntil || 0, performance.now() + duration);
    }

    triggerArcadeImpact(kind = 'perfect') {
        if (this.physicsProfile !== 'arcade' || !this.elArcadeImpact) return;
        const allowed = ['perfect', 'smash', 'super', 'winner', 'danger'];
        const safeKind = allowed.includes(kind) ? kind : 'perfect';
        clearTimeout(this.arcadeImpactTimer);
        this.elArcadeImpact.className = 'arcade-impact-flash';
        void this.elArcadeImpact.offsetWidth;
        this.elArcadeImpact.classList.add(`impact-${safeKind}`);
        this.arcadeImpactTimer = setTimeout(() => {
            if (this.elArcadeImpact) this.elArcadeImpact.className = 'arcade-impact-flash';
        }, safeKind === 'super' ? 300 : 220);
    }

    getArcadePointContext(winner) {
        const deficitBefore = this.opponentScore - this.playerScore;
        this.arcadeComebackMaxDeficit = Math.max(this.arcadeComebackMaxDeficit || 0, deficitBefore);
        const opponentMatchPoint = this.opponentScore >= this.targetPoints - 1 && this.opponentScore > this.playerScore;
        const scoreAfterPlayer = winner === 'player' ? this.playerScore + 1 : this.playerScore;
        const scoreAfterOpponent = winner === 'opponent' ? this.opponentScore + 1 : this.opponentScore;
        const comebackNow = winner === 'player'
            && !this.arcadeComebackTriggered
            && (this.arcadeComebackMaxDeficit || 0) >= 3
            && scoreAfterPlayer >= scoreAfterOpponent;
        return {
            deficitBefore,
            opponentMatchPoint,
            clutchSave: winner === 'player' && opponentMatchPoint,
            comebackNow
        };
    }

    getArcadeMatchRating(winner) {
        const margin = (this.playerScore || 0) - (this.opponentScore || 0);
        let score = 38;
        score += winner === 'player' ? 20 : 5;
        score += Math.min(18, (this.arcadeMaxCombo || 0) * 1.5);
        score += Math.min(14, (this.arcadePerfectHits || 0) * 1.5);
        score += Math.min(10, (this.arcadeSuperSmashes || 0) * 5);
        score += Math.min(6, (this.arcadePerfectServes || 0) * 1.5 + (this.arcadeAces || 0) * 2);
        score += Math.min(5, ((this.arcadeCurveShots || 0) + (this.arcadeDropShots || 0)) * 1.5);
        score += Math.min(8, (this.arcadeClutchSaves || 0) * 4);
        if (this.arcadeComebackTriggered) score += 6;
        score += Math.max(-10, Math.min(10, margin * 1.8));
        score = Math.max(0, Math.min(100, Math.round(score)));

        let grade = 'D';
        if (score >= 90) grade = 'S';
        else if (score >= 78) grade = 'A';
        else if (score >= 65) grade = 'B';
        else if (score >= 50) grade = 'C';

        return {
            grade, score,
            maxCombo: this.arcadeMaxCombo || 0,
            perfectHits: this.arcadePerfectHits || 0,
            superSmashes: this.arcadeSuperSmashes || 0,
            perfectServes: this.arcadePerfectServes || 0,
            aces: this.arcadeAces || 0,
            clutchSaves: this.arcadeClutchSaves || 0,
            comeback: !!this.arcadeComebackTriggered
        };
    }

    renderArcadeMatchReport(winner) {
        if (!this.elArcadeReport) return;
        const active = this.physicsProfile === 'arcade';
        this.elArcadeReport.classList.toggle('hidden', !active);
        if (!active) return;

        const report = this.getArcadeMatchRating(winner);
        if (this.elArcadeReportGrade) {
            this.elArcadeReportGrade.textContent = report.grade;
            this.elArcadeReportGrade.className = `arcade-report-grade grade-${report.grade.toLowerCase()}`;
        }
        if (this.elArcadeReportScore) this.elArcadeReportScore.textContent = `${report.score}/100`;
        if (this.elArcadeReportCombo) this.elArcadeReportCombo.textContent = `x${report.maxCombo}`;
        if (this.elArcadeReportPerfect) this.elArcadeReportPerfect.textContent = report.perfectHits;
        if (this.elArcadeReportSuper) this.elArcadeReportSuper.textContent = report.superSmashes;
        if (this.elArcadeReportClutch) this.elArcadeReportClutch.textContent = report.clutchSaves;
    }

    getTechniqueGrade(score) {
        const q = Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0));
        if (q >= 0.86) return 'A';
        if (q >= 0.72) return 'B';
        if (q >= 0.56) return 'C';
        return 'D';
    }

    getTechniqueFeedback(shot, outcome = null) {
        const t = (key, fallback) => window.i18n ? window.i18n.t(key) : fallback;
        if (outcome === 'net') return t('coach_feedback_net', 'NET: the face was too closed for this ball height. Open it slightly.');
        if (outcome === 'out' && shot && shot.outcomeDetail === 'own_table') return t('coach_feedback_own_table', 'OWN TABLE: lift the trajectory earlier and send the ball across the net.');
        if (outcome === 'out') return t('coach_feedback_out', 'LONG: the face was too open for this power. Close it slightly or reduce power.');
        if (outcome === 'in') return t('coach_feedback_in', 'IN: trajectory landed on the opponent table.');

        if (shot.forceNet || shot.netRisk >= 0.50) return t('coach_feedback_net', 'NET risk: open the face slightly.');
        if (shot.allowOut || shot.outRisk >= 0.50) return t('coach_feedback_out', 'Long-out risk: close the face slightly or reduce power.');
        if (shot.contactQuality < 0.70) return t('coach_feedback_center', 'Catch the ball closer to the center of the blade.');
        if (shot.spinX >= 82) return t('coach_feedback_topspin', 'Good topspin brush. The ball will dip harder.');
        if (shot.spinX <= -35) return t('coach_feedback_backspin', 'Backspin/chop contact. Expect a slower, floating trajectory.');
        if (Math.abs(shot.spinY) >= 42) return t('coach_feedback_side', 'Strong sidespin. Watch the lateral kick after the bounce.');
        return t('coach_feedback_clean', 'Clean contact. Keep the same racket path.');
    }

    recordProTechnique(technique, meta = {}) {
        if (!technique || this.physicsProfile !== 'pro') return;
        const risk = Math.max(technique.netRisk || 0, technique.outRisk || 0);
        const baseQuality = technique.contactQuality * 0.62 + (1 - risk) * 0.38;
        const quality = Number.isFinite(meta.quality) ? meta.quality : baseQuality;
        const shotType = meta.shotType || technique.type || 'drive';
        const side = technique.strokeSide === 'backhand' ? 'BH' : 'FH';
        const labelType = shotType === 'power' ? 'POWER SMASH'
            : shotType === 'controlled' ? 'SMASH'
                : shotType === 'overhit' ? 'OVERHIT'
                    : shotType.toUpperCase();

        this.lastPlayerTechnique = {
            ...technique,
            ...meta,
            quality,
            shotType,
            label: `${side} ${labelType}`,
            pendingOutcome: true,
            outcome: null
        };
        this.proMatchStats.shots += 1;
        this.proMatchStats.contactSum += Math.max(0, Math.min(1, technique.contactQuality || 0));
        this.proMatchStats.qualitySum += Math.max(0, Math.min(1, quality || 0));
        this.proMatchStats.maxSpeed = Math.max(this.proMatchStats.maxSpeed || 0, Number(meta.speedKmh) || 0);
        this.proMatchStats.maxSpin = Math.max(
            this.proMatchStats.maxSpin || 0,
            Math.abs(technique.spinX || 0),
            Math.abs(technique.spinY || 0)
        );
        this.matchMaxRally = Math.max(this.matchMaxRally || 0, this.rallyCount || 0);
        this.proMatchStats.maxRally = Math.max(this.proMatchStats.maxRally || 0, this.matchMaxRally);
        this.renderProTechnique(this.lastPlayerTechnique);
    }

    markProTechniqueOutcome(outcome, detail = null) {
        const shot = this.lastPlayerTechnique;
        if (!shot || !shot.pendingOutcome) return;
        if (!['in', 'net', 'out'].includes(outcome)) return;
        shot.pendingOutcome = false;
        shot.outcome = outcome;
        shot.outcomeDetail = detail;
        this.proCoachStats[outcome] = (this.proCoachStats[outcome] || 0) + 1;
        this.renderProTechnique(shot);
    }

    renderProTechnique(shot) {
        if (!shot) return;
        this.updateProCoachUI();
        if (this.physicsProfile !== 'pro' || !this.proCoachEnabled || !this.elTechniqueHud) return;

        const pct = Math.round(Math.max(0, Math.min(1, shot.contactQuality || 0)) * 100);
        const deg = Math.round((shot.faceAngle || 0) * 180 / Math.PI);
        const signed = (n) => `${n > 0 ? '+' : ''}${Math.round(n || 0)}`;
        const grade = this.getTechniqueGrade(shot.quality);

        if (this.elTechniqueGrade) {
            this.elTechniqueGrade.textContent = grade;
            this.elTechniqueGrade.className = `tech-hud-grade grade-${grade.toLowerCase()}`;
        }
        if (this.elTechniqueStroke) this.elTechniqueStroke.textContent = shot.label || 'PRO STROKE';
        if (this.elTechniqueSpeed) this.elTechniqueSpeed.textContent = `${Math.round(shot.speedKmh || 0)} km/h`;
        if (this.elTechniqueContact) this.elTechniqueContact.textContent = `${pct}%`;
        if (this.elTechniqueFace) this.elTechniqueFace.textContent = `${deg > 0 ? '+' : ''}${deg}°`;
        if (this.elTechniqueSpinX) this.elTechniqueSpinX.textContent = signed(shot.spinX);
        if (this.elTechniqueSpinY) this.elTechniqueSpinY.textContent = signed(shot.spinY);
        if (this.elTechniqueFeedback) this.elTechniqueFeedback.textContent = this.getTechniqueFeedback(shot, shot.outcome);

        this.elTechniqueHud.classList.remove('tech-good', 'tech-warn', 'tech-error');
        if (shot.outcome === 'net' || shot.outcome === 'out') this.elTechniqueHud.classList.add('tech-error');
        else if (shot.outcome === 'in' || grade === 'A') this.elTechniqueHud.classList.add('tech-good');
        else if (grade === 'C' || grade === 'D' || shot.netRisk >= 0.45 || shot.outRisk >= 0.45) this.elTechniqueHud.classList.add('tech-warn');

        const inEl = document.getElementById('tech-stat-in');
        const netEl = document.getElementById('tech-stat-net');
        const outEl = document.getElementById('tech-stat-out');
        if (inEl) inEl.textContent = this.proCoachStats.in || 0;
        if (netEl) netEl.textContent = this.proCoachStats.net || 0;
        if (outEl) outEl.textContent = this.proCoachStats.out || 0;
    }

    getProMatchSummary() {
        const stats = this.proMatchStats || {};
        const outcomes = (this.proCoachStats.in || 0) + (this.proCoachStats.net || 0) + (this.proCoachStats.out || 0);
        let accuracy = 0;
        if (outcomes > 0) {
            accuracy = Math.round((this.proCoachStats.in || 0) / outcomes * 100);
        } else if (stats.shots > 0) {
            accuracy = 100;
        }
        const avgContact = stats.shots > 0 ? Math.round((stats.contactSum || 0) / stats.shots * 100) : 0;
        const serveIn = stats.serves > 0 ? Math.round((stats.legalServes || 0) / stats.serves * 100) : 0;
        let maxRally = Math.max(0, stats.maxRally || 0, this.matchMaxRally || 0);
        if (maxRally === 0 && (stats.shots > 0 || stats.serves > 0 || ((this.playerScore || 0) + (this.opponentScore || 0)) > 0)) {
            maxRally = 1;
        }
        return {
            accuracy,
            avgContact,
            maxSpeed: Math.round(stats.maxSpeed || 0),
            maxSpin: Math.round(stats.maxSpin || 0),
            serveIn,
            aces: stats.aces || 0,
            maxRally
        };
    }

    renderProMatchReport() {
        const proReportEl = this.elProReport || document.getElementById('pro-performance-report');
        if (!proReportEl) return;
        const active = this.physicsProfile === 'pro';
        proReportEl.classList.toggle('hidden', !active);
        if (!active) return;

        const report = this.getProMatchSummary();
        const elAcc = this.elProReportAccuracy || document.getElementById('pro-report-accuracy');
        const elContact = this.elProReportContact || document.getElementById('pro-report-contact');
        const elSpeed = this.elProReportSpeed || document.getElementById('pro-report-speed');
        const elSpin = this.elProReportSpin || document.getElementById('pro-report-spin');
        const elServe = this.elProReportServe || document.getElementById('pro-report-serve');
        const elRally = this.elProReportRally || document.getElementById('pro-report-rally');

        if (elAcc) elAcc.textContent = `${report.accuracy}%`;
        if (elContact) elContact.textContent = `${report.avgContact}%`;
        if (elSpeed) elSpeed.textContent = `${report.maxSpeed} km/h`;
        if (elSpin) elSpin.textContent = `${report.maxSpin}`;
        if (elServe) elServe.textContent = `${report.serveIn}%`;
        if (elRally) elRally.textContent = report.maxRally;
    }

    renderCountryGrid() {
        const grid = document.getElementById('country-grid');
        if (!grid || !this.tournament) return;
        grid.innerHTML = '';

        Object.values(this.tournament.COUNTRIES).forEach(c => {
            const countryName = window.i18n ? window.i18n.getCountryName(c.code) : c.name;
            const countryStyle = window.i18n ? window.i18n.getCountryStyle(c.code) : c.style;
            const card = document.createElement('div');
            card.className = `country-card ${c.code === this.tempSelectedCountry ? 'active' : ''}`;
            card.innerHTML = `
                <div class="country-flag-wrap">
                    <img src="${c.flag}" alt="${countryName}">
                </div>
                <div class="country-details">
                    <div class="country-name">${countryName}</div>
                    <div class="country-style">${countryStyle}</div>
                </div>
                <div class="country-rating">${c.rating}</div>
            `;
            card.addEventListener('click', () => {
                this.tempSelectedCountry = c.code;
                grid.querySelectorAll('.country-card').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
            });
            grid.appendChild(card);
        });
    }

    renderBracket() {
        const container = document.getElementById('bracket-container');
        if (!container || !this.tournament || !this.tournament.bracket) return;
        container.innerHTML = '';

        const currentStageIdx = this.tournament.currentStageIndex;
        const b = this.tournament.bracket;
        const isWorld = this.tournament.tournamentType === 'world';
        const tbdText = window.i18n ? window.i18n.t('tbd_label') : 'Belirlenmedi';

        const getC = (code) => {
            if (!code) return { name: tbdText, flag: '', isTBD: true };
            const countryData = this.tournament.COUNTRIES[code];
            const localizedName = window.i18n ? window.i18n.getCountryName(code) : (countryData ? countryData.name : code);
            return {
                name: localizedName,
                flag: countryData ? countryData.flag : 'assets/tr.svg',
                isTBD: false
            };
        };

        const r16Title = window.i18n ? window.i18n.t('stage_r16') : 'SON 16 TURU';
        const qfTitle = window.i18n ? window.i18n.t('stage_qf') : 'ÇEYREK FİNAL';
        const sfTitle = window.i18n ? window.i18n.t('stage_sf') : 'YARI FİNAL';
        const fnTitle = (window.i18n ? window.i18n.t('stage_fn') : 'BÜYÜK FİNAL') + ' 🏆';

        let rounds;
        if (isWorld) {
            rounds = [
                { id: 'r16', title: r16Title, matches: b.r16 || [], stageIdx: 0 },
                { id: 'qf', title: qfTitle, matches: b.qf || [], stageIdx: 1 },
                { id: 'sf', title: sfTitle, matches: b.sf || [], stageIdx: 2 },
                { id: 'fn', title: fnTitle, matches: b.fn || [], stageIdx: 3 }
            ];
        } else {
            rounds = [
                { id: 'qf', title: qfTitle, matches: b.qf || [], stageIdx: 0 },
                { id: 'sf', title: sfTitle, matches: b.sf || [], stageIdx: 1 },
                { id: 'fn', title: fnTitle, matches: b.fn || [], stageIdx: 2 }
            ];
        }

        const bracketDesc = document.getElementById('bracket-modal-desc');
        if (bracketDesc && window.i18n) {
            bracketDesc.textContent = isWorld
                ? window.i18n.t('bracket_desc_world')
                : window.i18n.t('bracket_desc_masters');
        }

        rounds.forEach(rnd => {
            const col = document.createElement('div');
            col.className = 'bracket-column';
            col.innerHTML = `<div class="bracket-col-header">${rnd.title}</div>`;

            rnd.matches.forEach(m => {
                const c1 = getC(m.p1);
                const c2 = getC(m.p2);
                const isCurrent = (currentStageIdx === rnd.stageIdx) && m.isPlayer;
                const matchCard = document.createElement('div');
                matchCard.className = `bracket-match-card ${m.isPlayer ? 'is-player-match' : ''} ${isCurrent ? 'is-current-match' : ''}`;

                const p1Winner = m.winner === m.p1 && m.p1 !== null;
                const p2Winner = m.winner === m.p2 && m.p2 !== null;

                matchCard.innerHTML = `
                    <div class="bracket-team-line ${p1Winner ? 'is-winner' : ''} ${c1.isTBD ? 'is-tbd' : ''}">
                        ${c1.isTBD ? '<span class="bracket-team-tbd-dot">●</span>' : `<img class="bracket-team-flag" src="${c1.flag}" alt="${c1.name}">`}
                        <span class="bracket-team-name">${c1.name}</span>
                        <span class="bracket-team-score">${m.score ? m.score.split('-')[0].trim() : (p1Winner ? 'W' : '-')}</span>
                    </div>
                    <div class="bracket-team-line ${p2Winner ? 'is-winner' : ''} ${c2.isTBD ? 'is-tbd' : ''}">
                        ${c2.isTBD ? '<span class="bracket-team-tbd-dot">●</span>' : `<img class="bracket-team-flag" src="${c2.flag}" alt="${c2.name}">`}
                        <span class="bracket-team-name">${c2.name}</span>
                        <span class="bracket-team-score">${m.score ? m.score.split('-')[1].trim() : (p2Winner ? 'W' : '-')}</span>
                    </div>
                `;
                col.appendChild(matchCard);
            });

            container.appendChild(col);
        });

        const playBtnText = document.getElementById('btn-bracket-play-text');
        const stagePill = document.getElementById('bracket-stage-pill');
        const totalStages = this.tournament.stages ? this.tournament.stages.length : 3;

        if (playBtnText) {
            if (currentStageIdx >= totalStages) {
                playBtnText.textContent = window.i18n ? window.i18n.t('btn_tournament_celebrate') : 'KUPAYI KUTLA 🏆';
                if (stagePill) stagePill.textContent = window.i18n ? window.i18n.t('stage_champ') : '🏆 DÜNYA ŞAMPİYONU';
            } else {
                const stage = this.tournament.getCurrentStage();
                const stageName = (window.i18n ? window.i18n.t(stage.nameKey) : stage.nameFallback) || stage.nameFallback;
                const curMatch = this.tournament.getCurrentMatch();
                const isRetry = curMatch && curMatch.winner && curMatch.winner !== this.tournament.playerCountry;

                if (isRetry) {
                    const retryWord = window.i18n ? window.i18n.t('btn_retry_match') : 'TEKRAR DENE ↺';
                    playBtnText.textContent = `${stageName} - ${retryWord}`;
                    if (stagePill) stagePill.textContent = `⚠️ ${stageName}`;
                } else {
                    const playWord = window.i18n ? window.i18n.t('btn_bracket_play') : 'MAÇA BAŞLA 🏓';
                    playBtnText.textContent = `${stageName} - ${playWord}`;
                    if (stagePill) stagePill.textContent = `🌍 ${stageName}`;
                }
            }
        }
    }

    setDifficulty(level, showFeedback = true, force = false) {
        if (!['easy', 'medium', 'hard'].includes(level)) level = 'medium';


        if (this.gameMode === 'tournament' && !force) {
            const msg = window.i18n ? window.i18n.t('callout_diff_locked_tourney') : '🔒 Turnuva süresince yapay zeka zorluğu değiştirilemez!';
            this.showCallout(msg, '#f59e0b', 1400);
            if (this.audio) this.audio.play('hit', 0, 0.7);
            return;
        }

        this.ai.setDifficulty(level);
        if (this.gameMode !== 'tournament') {
            try {
                localStorage.setItem('tt_difficulty', level);
            } catch (e) {}
        }

        this.updateDifficultyUI();

        if (showFeedback) {
            if (this.audio) this.audio.play('hit', 0, 1.15);
            const calloutKey = `diff_${level}_selected`;
            const calloutMsg = window.i18n ? window.i18n.t(calloutKey) : `${level.toUpperCase()} MODE`;
            const colors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
            this.showCallout(calloutMsg, colors[level] || '#ffffff', 1100);
        }
    }

    updateDifficultyUI() {
        const inTourney = this.gameMode === 'tournament';
        const level = inTourney
            ? ((this.tournament && this.tournament.difficulty) || this.ai.difficulty || 'medium')
            : (this.ai.difficulty || 'medium');

        const diffSection = document.getElementById('pause-diff-section');
        const lockBadge = document.getElementById('diff-locked-badge');
        const selector = document.getElementById('pause-diff-selector');

        if (diffSection) diffSection.classList.toggle('is-locked', inTourney);
        if (lockBadge) lockBadge.classList.toggle('hidden', !inTourney);
        if (selector) selector.classList.toggle('is-locked', inTourney);


        document.querySelectorAll('.diff-btn').forEach(b => {
            b.classList.toggle('locked', inTourney);
            b.classList.toggle('active', b.dataset.diff === level);
            if (inTourney) {
                b.setAttribute('title', window.i18n ? window.i18n.t('diff_locked_in_tourney') : 'Turnuvada Kilitli');
            } else {
                b.removeAttribute('title');
            }
        });

    }

    updateLanguageUI(lang) {
        const topLangSelect = document.getElementById('lang-select-top');
        if (topLangSelect) topLangSelect.value = lang;

        document.querySelectorAll('.lang-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.updateDifficultyUI();
        this.updatePhysicsProfileUI();
        this.applyTournamentMatch();
    }

    scheduleServeReplay() {
        if (this.physicsProfile === 'pro' && this.servingSide === 'player') this.cancelProServeAttempt();
        this.pendingServeReplay = true;
        this.serveTouchedNet = false;
        this.state = 'serve_replay';
        if (this.physics) this.physics.inPlay = false;
        const replayMsg = window.i18n ? window.i18n.t('let_replay') : 'FİLE - TEKRAR!';
        this.showCallout(replayMsg, '#ffb300');
        clearTimeout(this.netReplayTimeout);
        this.netReplayTimeout = setTimeout(() => {
            if (this.state === 'serve_replay') {
                this.pendingServeReplay = false;
                this.prepareServe();
            }
        }, 1200);
    }

    setupPhysicsHooks() {

        this.physics.onBounce = (side, x, z) => {
            this.audio.play('bounce', x / 0.8, 0.95);
            this.renderer.addBounceEffect(x, z);

            const lastHitter = this.physics.lastHitter;
            const history = this.physics.bounceHistory;


            if (this.isServe) {
                if (history.length === 1) {

                    if (side !== lastHitter) {
                        const faultMsg = window.i18n ? window.i18n.t('fault_serve') : 'Hatalı Servis!';
                        this.awardPoint(lastHitter === 'player' ? 'opponent' : 'player', faultMsg);
                    }
                } else if (history.length === 2) {

                    if (side === lastHitter) {
                        const faultMsg = window.i18n ? window.i18n.t('fault_serve') : 'Hatalı Servis!';
                        this.awardPoint(lastHitter === 'player' ? 'opponent' : 'player', faultMsg);
                    } else {


                        if (this.physicsProfile === 'pro' && this.serveTouchedNet) {
                            this.scheduleServeReplay();
                            return;
                        }


                        if (this.physicsProfile === 'pro' && lastHitter === 'player') {
                            this.recordProServeLegal();
                        }
                        this.serveTouchedNet = false;
                        this.isServe = false;
                        this.state = 'rally';
                        if (lastHitter === 'player') {
                            this.physics.hasBouncedOnPlayerTable = false;
                        } else {
                            this.physics.hasBouncedOnOpponentTable = false;
                        }
                    }
                } else if (history.length > 2) {

                    const faultMsg = window.i18n ? window.i18n.t('fault_double_bounce') : 'Çift Sekme!';
                    this.awardPoint(lastHitter, faultMsg);
                }
                return;
            }


            if (lastHitter === 'player' && history.length === 1 && side === 'opponent') {
                this.markProTechniqueOutcome('in');
            }


            if (history.length === 1) {

                if (side === lastHitter) {
                    if (lastHitter === 'player') this.markProTechniqueOutcome('out', 'own_table');
                    const faultMsg = window.i18n ? window.i18n.t('fault_own_table') : 'Kendi Masana Sekti!';
                    this.awardPoint(lastHitter === 'player' ? 'opponent' : 'player', faultMsg);
                }
            } else if (history.length >= 2) {

                const ptMsg = window.i18n ? window.i18n.t('point_generic') : 'Sayı!';
                this.awardPoint(lastHitter, ptMsg);
            }
        };


        this.physics.onNetHit = (isChord) => {
            this.audio.play('block', 0, 0.7);




            if (isChord) {
                if (this.isServe) this.serveTouchedNet = true;
                return;
            }

            if (this.physics.lastHitter === 'player' && !this.isServe) {
                this.markProTechniqueOutcome('net');
            }
            if (this.isServe) {
                const netFaultMsg = window.i18n ? window.i18n.t('fault_net') : 'File Hatası!';
                this.awardPoint(this.servingSide === 'player' ? 'opponent' : 'player', netFaultMsg);
            } else {
                const netFaultMsg = window.i18n ? window.i18n.t('fault_net') : 'File Hatası!';
                this.awardPoint(this.physics.lastHitter === 'player' ? 'opponent' : 'player', netFaultMsg);
            }
        };


        this.physics.onHit = (side) => {
            this.rallyCount++;
            this.matchMaxRally = Math.max(this.matchMaxRally || 0, this.rallyCount);
            if (this.proMatchStats) {
                this.proMatchStats.maxRally = Math.max(this.proMatchStats.maxRally || 0, this.matchMaxRally);
            }
            this.updateRallyCounter(this.rallyCount);
        };
    }

    prepareServe() {
        clearTimeout(this.opponentServeTimeout);
        clearTimeout(this.nextPointTimeout);
        clearTimeout(this.netReplayTimeout);
        this.pendingServeReplay = false;
        this.serveTouchedNet = false;

        this.state = 'serving';
        this.isServe = true;
        this.rallyCount = 0;
        this.updateRallyCounter(0);
        this.resetArcadePointFlow(true);
        if (this.physics && typeof this.physics.reset === 'function') {
            this.physics.reset(this.servingSide);
        }
        if (this.controller && typeof this.controller.resetPointTracking === 'function') {
            this.controller.resetPointTracking();
        } else if (this.controller) {
            this.controller.prevBallPos = null;
        }
        if (this.ai && typeof this.ai.resetPointState === 'function') {
            this.ai.resetPointState();
        } else if (this.ai) {
            this.ai.prevBallPos = null;
        }
        this.lastArcadeServePlan = null;
        this.lastProServePlan = null;
        this.updateArcadeServeAim();


        if (this.elServeIndicator) {
            this.elServeIndicator.className = `serve-ball ${this.servingSide}`;
        }

        if (this.servingSide === 'player') {
            const msg = window.i18n ? window.i18n.t('serve_player') : 'SERVİS SIRASI SENDE 🏓';
            this.showCallout(msg, '#4caf50', 2000);
        } else {
            const msg = window.i18n ? window.i18n.t('serve_opponent') : 'RAKİP SERVİS ATIYOR...';
            this.showCallout(msg, '#29b6f6', 1500);
            this.opponentServeTimeout = setTimeout(() => {
                if (this.state === 'serving' && this.servingSide === 'opponent') {
                    this.ai.launchServe();
                }
            }, 1000);
        }
    }

    launchServe() {
        if (this.state !== 'serving' || this.servingSide !== 'player') return;


        this.state = 'rally';
        this.isServe = true;
        this.controller.hitCooldown = 0.6;
        this.controller.prevBallPos = null;

        this.rallyCount = 1;
        this.matchMaxRally = Math.max(this.matchMaxRally || 0, 1);
        if (this.proMatchStats) {
            this.proMatchStats.maxRally = Math.max(this.proMatchStats.maxRally || 0, this.matchMaxRally);
        }
        this.updateRallyCounter(1);

        this.audio.play('hit', 0, 1.0);

        let targetX;
        let targetZ;
        let sidespin = 0;
        let spinX = 20;
        if (this.physicsProfile === 'arcade') {
            const plan = this.getArcadeServePlan();
            targetX = plan.targetX;
            targetZ = plan.targetZ;
            sidespin = plan.sidespin;
            this.recordArcadeServe(plan);
        } else {
            const plan = this.getProServePlan();
            targetX = plan.targetX;
            targetZ = plan.targetZ;
            sidespin = plan.sidespin;
            spinX = plan.spinX;
            this.recordProServe(plan);
        }

        if (this.renderer && typeof this.renderer.setArcadeServeAim === 'function') {
            this.renderer.setArcadeServeAim(0, -0.92, false);
        }
        if (this.elArcadeServeAimHud) this.elArcadeServeAimHud.classList.add('hidden');
        this.physics.serveBall('player', targetX, targetZ, sidespin, spinX);
    }

    awardPoint(winner, reason = 'Sayı!') {
        if (this.state === 'point_end' || this.state === 'match_end') return;
        this.matchMaxRally = Math.max(this.matchMaxRally || 0, this.rallyCount || 0);
        if (this.tournament) {
            this.tournament.recordHighestRally(this.rallyCount);
        }
        if (this.proMatchStats) {
            this.proMatchStats.maxRally = Math.max(this.proMatchStats.maxRally || 0, this.matchMaxRally);
        }
        if (this.lastPlayerTechnique && this.lastPlayerTechnique.pendingOutcome) {
            if (winner === 'opponent' && this.physics && this.physics.lastHitter === 'player') {
                this.markProTechniqueOutcome('out');
            } else if (winner === 'player' && this.physics && this.physics.lastHitter === 'player') {
                this.markProTechniqueOutcome('in');
            }
        }
        this.state = 'point_end';
        this.pendingServeReplay = false;
        this.serveTouchedNet = false;
        this.physics.inPlay = false;

        const arcadePoint = this.physicsProfile === 'arcade' ? this.getArcadePointContext(winner) : null;
        const arcadeAce = this.physicsProfile === 'arcade'
            && winner === 'player'
            && this.servingSide === 'player'
            && !!this.lastArcadeServePlan
            && this.rallyCount <= 1;
        const proAce = this.physicsProfile === 'pro'
            && winner === 'player'
            && this.servingSide === 'player'
            && !!this.lastProServePlan
            && this.rallyCount <= 1;

        if (this.physicsProfile === 'arcade') {
            if (winner === 'player') {
                const rallyBonus = Math.min(10, Math.max(0, this.arcadeCombo - 1));
                this.arcadeMomentum = Math.min(100, this.arcadeMomentum + rallyBonus);
            } else {

                this.arcadeMomentum = Math.max(0, this.arcadeMomentum - 28);
            }
            this.arcadeCombo = 0;
            this.updateArcadeFlowUI();
        }

        if (this.audio && typeof this.audio.play === 'function') {
            this.audio.play('score', 0, 1.1);
        }

        const isOut = (reason || '').toLowerCase().includes('out');

        if (winner === 'player') {
            this.playerScore++;
            if (this.physicsProfile === 'arcade') {
                this.arcadePointsWon += 1;
                if (this.physics.isPlayerSmash) this.arcadeSmashWinners += 1;
                if (arcadeAce) this.arcadeAces += 1;
                if (arcadePoint && arcadePoint.clutchSave) this.arcadeClutchSaves += 1;
                if (arcadePoint && arcadePoint.comebackNow) this.arcadeComebackTriggered = true;
            } else if (proAce) {
                this.proMatchStats.aces += 1;
            }
            if (this.controller && typeof this.controller.triggerHaptic === 'function') {
                this.controller.triggerHaptic(35);
            }
            this.flipScore(this.elScorePlayer, this.playerScore);
            let msg;
            let color = '#00e676';
            if (arcadeAce) {
                msg = window.i18n ? window.i18n.t('arcade_ace') : 'ACE! 🎯';
                color = '#69f0ae';
                this.triggerArcadeImpact('winner');
            } else if (proAce) {
                msg = window.i18n ? window.i18n.t('pro_ace') : 'ACE · PRO SERVE 🎯';
                color = '#00e5ff';
            } else if (this.physicsProfile === 'arcade' && arcadePoint && arcadePoint.clutchSave) {
                msg = window.i18n ? window.i18n.t('arcade_clutch_save') : 'CLUTCH SAVE! 🔥';
                color = '#ffc83b';
                this.triggerArcadeImpact('winner');
            } else if (this.physicsProfile === 'arcade' && arcadePoint && arcadePoint.comebackNow) {
                msg = window.i18n ? window.i18n.t('arcade_comeback') : 'COMEBACK! ⚡';
                color = '#00e5ff';
                this.triggerArcadeImpact('winner');
            } else if (this.physics.isPlayerSmash) {
                msg = window.i18n ? window.i18n.t('point_smash_winner') : '💥 SMAÇ SAYISI! ⚡';
                color = '#ff3d00';
                if (this.physicsProfile === 'arcade') this.triggerArcadeImpact('winner');
            } else if (isOut) {
                msg = window.i18n ? window.i18n.t('point_player_out') : 'OUT! SAYI SENİN 🎯';
            } else {
                msg = window.i18n ? window.i18n.t('point_player') : 'SAYI SENİN! 🎯';
            }
            this.showCallout(msg, color, 1400);
        } else {
            this.opponentScore++;
            if (this.physicsProfile === 'arcade') {
                this.arcadePointsLost += 1;
                this.arcadeComebackMaxDeficit = Math.max(this.arcadeComebackMaxDeficit || 0, this.opponentScore - this.playerScore);
                if (this.opponentScore >= this.targetPoints - 1 && this.opponentScore > this.playerScore) {
                    this.triggerArcadeImpact('danger');
                }
            }
            this.flipScore(this.elScoreOpponent, this.opponentScore);
            const msg = window.i18n
                ? (isOut ? window.i18n.t('point_opponent_out') : window.i18n.t('point_opponent'))
                : (isOut ? 'OUT! RAKİP ALDI' : 'SAYI RAKİBİN');
            this.showCallout(msg, '#ff1744', 1300);
        }


        const isDeuce = this.playerScore >= this.targetPoints - 1 && this.opponentScore >= this.targetPoints - 1;
        if (this.playerScore >= this.targetPoints && this.playerScore - this.opponentScore >= 2) {
            this.endMatch('player');
            return;
        } else if (this.opponentScore >= this.targetPoints && this.opponentScore - this.playerScore >= 2) {
            this.endMatch('opponent');
            return;
        }


        this.serveCount++;
        const rotateThreshold = isDeuce ? 1 : 2;
        if (this.serveCount % rotateThreshold === 0) {
            this.servingSide = (this.servingSide === 'player') ? 'opponent' : 'player';
        }


        clearTimeout(this.nextPointTimeout);
        this.nextPointTimeout = setTimeout(() => {
            if (this.state === 'point_end') {
                this.prepareServe();
            }
        }, 1600);
    }

    flipScore(el, newScore) {
        if (!el) return;
        if (!this.scoreFlipTimers) this.scoreFlipTimers = new Map();
        const existing = this.scoreFlipTimers.get(el);
        if (existing) clearTimeout(existing);
        el.classList.add('flipping');
        const timer = setTimeout(() => {
            el.textContent = newScore;
            el.classList.remove('flipping');
            if (this.scoreFlipTimers) this.scoreFlipTimers.delete(el);
        }, 250);
        this.scoreFlipTimers.set(el, timer);
    }

    cancelScoreFlipAnimations() {
        if (this.scoreFlipTimers) {
            for (const timer of this.scoreFlipTimers.values()) clearTimeout(timer);
            this.scoreFlipTimers.clear();
        }
        [this.elScorePlayer, this.elScoreOpponent].forEach(el => el?.classList.remove('flipping'));
    }

    updateRallyCounter(count) {
        if (!this.elRallyContainer || !this.elRallyNum) return;
        if (count <= 0) {
            this.elRallyContainer.classList.remove('visible');
            setTimeout(() => {
                if (this.rallyCount <= 0 && this.elRallyContainer) {
                    this.elRallyContainer.classList.add('hidden');
                }
            }, 250);
            return;
        }

        this.elRallyNum.textContent = count;
        this.elRallyContainer.classList.remove('hidden');

        void this.elRallyContainer.offsetWidth;
        this.elRallyContainer.classList.add('visible');


        this.elRallyContainer.classList.remove('pop');
        void this.elRallyContainer.offsetWidth;
        this.elRallyContainer.classList.add('pop');
    }

    showCallout(text, color = '#ffffff', duration = 1500) {
        if (!this.elCallout) return;
        this.elCallout.textContent = text;
        this.elCallout.style.color = color;
        this.elCallout.classList.remove('hidden');
        this.elCallout.classList.add('show');

        clearTimeout(this.calloutTimer);
        this.calloutTimer = setTimeout(() => {
            this.elCallout.classList.remove('show');
            this.elCallout.classList.add('hidden');
        }, duration);
    }

    pauseGame(showPauseModal = false) {
        if (this.state === 'match_end') return;
        if (this.state !== 'paused') {
            this.prevState = this.state;
            this.state = 'paused';
        }


        clearTimeout(this.opponentServeTimeout);
        clearTimeout(this.nextPointTimeout);
        clearTimeout(this.netReplayTimeout);

        if (showPauseModal) {

            const elPScore = document.getElementById('pause-score-player');
            const elOScore = document.getElementById('pause-score-opponent');
            if (elPScore) elPScore.textContent = this.playerScore;
            if (elOScore) elOScore.textContent = this.opponentScore;

            this.updateDifficultyUI();
            this.updatePhysicsProfileUI();
            if (window.i18n) {
                this.updateLanguageUI(window.i18n.currentLanguage);
            }
            this.elPauseModal?.classList.remove('hidden');
        } else {
            this.elPauseModal?.classList.add('hidden');
        }
    }

    resumeGame() {
        if (this.state === 'match_end') return;
        if (this.state !== 'paused') return;


        const restoreState = (this.prevState && this.prevState !== 'paused') ? this.prevState : 'serving';
        this.state = restoreState;
        this.elPauseModal?.classList.add('hidden');


        if (this.controller) {
            this.controller.prevMouse.time = performance.now();
            this.controller.velocity = { x: 0, y: 0, speed: 0 };
        }
        this.lastTime = performance.now();

        if (this.profileChangeRequiresServeReset) {
            this.profileChangeRequiresServeReset = false;
            this.prepareServe();
            return;
        }

        if (restoreState === 'serving') {
            if (this.servingSide === 'player') {
                if (!this.physics.inPlay) {
                    this.physics.reset('player');
                }
            } else {
                if (!this.physics.inPlay) {
                    this.physics.reset('opponent');
                }

                clearTimeout(this.opponentServeTimeout);
                this.opponentServeTimeout = setTimeout(() => {
                    if (this.state === 'serving' && this.servingSide === 'opponent') {
                        this.ai.launchServe();
                    }
                }, 800);
            }
        } else if (restoreState === 'serve_replay') {


            this.pendingServeReplay = false;
            clearTimeout(this.netReplayTimeout);
            this.prepareServe();
        } else if (restoreState === 'point_end') {

            clearTimeout(this.nextPointTimeout);
            this.prepareServe();
        }
    }

    togglePause() {
        if (this.state === 'match_end') return;

        if (this.state === 'paused') {
            if (this.elPauseModal && !this.elPauseModal.classList.contains('hidden')) {
                this.resumeGame();
            } else {
                this.pauseGame(true);
            }
        } else {
            this.pauseGame(true);
        }
    }

    updateSoundUI() {
        const isMuted = this.audio ? this.audio.muted : false;
        const iconWrap = document.getElementById('sound-icon-wrap');
        const soundLbl = document.getElementById('sound-btn-text');
        if (iconWrap) {
            iconWrap.innerHTML = isMuted
                ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>'
                : '<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        }
        if (soundLbl) {
            soundLbl.textContent = isMuted ? 'MUTE' : (window.i18n ? window.i18n.t('sound_label') : 'SOUND');
        }
    }

    toggleSound() {
        this.audio.toggleMute();
        this.updateSoundUI();
    }

    toggleFullscreen() {
        const doc = document;
        const docEl = document.documentElement;
        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (!isFs) {
            const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (req) {
                const p = req.call(docEl);
                if (p && typeof p.catch === 'function') {
                    p.catch(err => console.warn('Fullscreen request failed:', err));
                }
            }
        } else {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exit) {
                const p = exit.call(doc);
                if (p && typeof p.catch === 'function') {
                    p.catch(err => console.warn('Exit fullscreen failed:', err));
                }
            }
        }
    }

    updateFullscreenUI() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (document.body) {
            document.body.classList.toggle('is-fullscreen', isFs);
            document.body.classList.toggle('not-fullscreen', !isFs);
        }

        const iconEnter = document.getElementById('icon-fs-enter');
        const iconExit = document.getElementById('icon-fs-exit');
        const btnFs = document.getElementById('btn-fullscreen');
        const btnModalFs = document.getElementById('btn-modal-fullscreen');
        const fsLbl = document.getElementById('fs-btn-text');

        if (iconEnter && iconExit) {
            if (isFs) {
                iconEnter.classList.add('hidden');
                iconExit.classList.remove('hidden');
                if (btnFs) btnFs.title = window.i18n ? window.i18n.t('fullscreen_exit_title') : 'Tam Ekrandan Çık (F)';
                if (fsLbl) fsLbl.textContent = 'EXIT';
            } else {
                iconEnter.classList.remove('hidden');
                iconExit.classList.add('hidden');
                if (btnFs) btnFs.title = window.i18n ? window.i18n.t('fullscreen_enter_title') : 'Tam Ekran (F)';
                if (fsLbl) fsLbl.textContent = window.i18n ? window.i18n.t('fullscreen_label') : 'FULL';
            }
        }

        if (btnModalFs) {
            btnModalFs.textContent = isFs
                ? (window.i18n ? window.i18n.t('fullscreen_exit_btn') : 'TAM EKRANDAN ÇIK')
                : (window.i18n ? window.i18n.t('fullscreen_enter_btn') : 'TAM EKRAN (AÇ)');
        }

        const hintEl = document.getElementById('fullscreen-hint');
        if (hintEl) {
            if (isFs) {
                hintEl.classList.add('hidden');
            } else {
                hintEl.classList.remove('hidden');
            }
        }

        if (isFs) {
            const fsCallout = window.i18n ? window.i18n.t('fullscreen_callout') : 'TAM EKRAN MODU ⛶';
            this.showCallout(fsCallout, '#00e5ff', 1200);
        }

        setTimeout(() => {
            if (this.renderer && typeof this.renderer.onWindowResize === 'function') {
                this.renderer.onWindowResize();
            }
        }, 50);
    }

    resetMatch() {
        clearTimeout(this.opponentServeTimeout);
        clearTimeout(this.nextPointTimeout);
        clearTimeout(this.netReplayTimeout);
        clearTimeout(this.arcadeImpactTimer);
        this.pendingServeReplay = false;
        this.serveTouchedNet = false;
        this.profileChangeRequiresServeReset = false;
        this.cancelScoreFlipAnimations();
        if (this.elArcadeImpact) this.elArcadeImpact.className = 'arcade-impact-flash';

        this.playerScore = 0;
        this.opponentScore = 0;
        this.serveCount = 0;
        this.servingSide = 'player';
        this.lastMatchWinner = null;
        this.resetArcadePointFlow(false);
        this.arcadePointsWon = 0;
        this.arcadePointsLost = 0;
        this.arcadeSmashWinners = 0;
        this.arcadeClutchSaves = 0;
        this.arcadeComebackMaxDeficit = 0;
        this.arcadeComebackTriggered = false;
        this.arcadeHitStopUntil = 0;
        this.matchMaxRally = 0;
        this.proCoachStats = { in: 0, net: 0, out: 0 };
        this.proMatchStats = { shots: 0, contactSum: 0, qualitySum: 0, maxSpeed: 0, maxSpin: 0, serves: 0, legalServes: 0, aces: 0, maxRally: 0 };
        this.lastPlayerTechnique = null;
        this.lastProServePlan = null;
        if (this.elArcadeReport) this.elArcadeReport.classList.add('hidden');
        if (this.elProReport) this.elProReport.classList.add('hidden');
        this.elScorePlayer.textContent = '0';
        this.elScoreOpponent.textContent = '0';
        if (this.elPauseModal) this.elPauseModal.classList.add('hidden');
        if (this.elGameOverModal) this.elGameOverModal.classList.add('hidden');
        if (this.elBracketModal) this.elBracketModal.classList.add('hidden');
        if (this.elCountryModal) this.elCountryModal.classList.add('hidden');

        if (this.tournament) {
            this.trophies = typeof this.tournament.getCareerStats === 'function'
                ? this.tournament.getCareerStats().trophies
                : (this.tournament.careerTrophies || 0);
            if (this.elTrophyCount) this.elTrophyCount.textContent = this.trophies;
        }

        if (this.tournament && this.gameMode === 'tournament') {
            const totalStages = this.tournament.stages ? this.tournament.stages.length : 3;
            if (this.tournament.currentStageIndex >= totalStages) {
                this.tournament.startNewTournament(this.tournament.playerCountry, this.tournament.tournamentType, this.tournament.difficulty);
            } else {
                const curMatch = this.tournament.getCurrentMatch();
                if (curMatch && curMatch.winner) {
                    this.tournament.retryCurrentStage();
                }
            }
            this.applyTournamentMatch();
            this.renderBracket();
        } else if (this.tournament) {
            this.applyTournamentMatch();
            this.renderBracket();
        }

        this.prepareServe();
    }

    endMatch(winner) {


        if (this.state === 'match_end') return;

        clearTimeout(this.opponentServeTimeout);
        clearTimeout(this.nextPointTimeout);
        clearTimeout(this.netReplayTimeout);
        this.pendingServeReplay = false;
        this.serveTouchedNet = false;

        this.state = 'match_end';
        if (this.physics) this.physics.inPlay = false;
        this.lastMatchWinner = winner;
        this.updateRallyCounter(0);
        if (this.renderer && typeof this.renderer.setArcadeServeAim === 'function') this.renderer.setArcadeServeAim(0, -0.92, false);
        if (this.elArcadeServeAimHud) this.elArcadeServeAimHud.classList.add('hidden');
        this.audio.play('whistle_end', 0, 1.2);

        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const iconEl = document.getElementById('game-over-icon');
        const gameOverCard = document.querySelector('.game-over-card');
        const goScorePlayer = document.getElementById('go-score-player');
        const goScoreOpponent = document.getElementById('go-score-opponent');
        const advanceBtn = document.getElementById('btn-tournament-advance');
        const advanceBtnText = document.getElementById('btn-tournament-advance-text');
        const rematchBtn = document.getElementById('btn-rematch');
        const rematchText = rematchBtn ? rematchBtn.querySelector('span') : null;



        const showRematch = this.gameMode !== 'tournament' || winner !== 'player';
        rematchBtn?.classList.toggle('hidden', !showRematch);
        if (rematchText) {
            const retryKey = this.gameMode === 'tournament' ? 'btn_retry_match' : 'btn_rematch';
            rematchText.textContent = window.i18n ? window.i18n.t(retryKey) : (this.gameMode === 'tournament' ? 'TEKRAR DENE ↺' : 'YENİDEN OYNA');
            rematchText.setAttribute('data-i18n', retryKey);
        }

        if (this.tournament) {
            if (this.gameMode === 'tournament') {
                this.tournament.recordMatchResult(winner, this.playerScore, this.opponentScore);
                this.renderBracket();
            } else if (typeof this.tournament.recordQuickMatchResult === 'function') {
                this.tournament.recordQuickMatchResult(winner, this.playerScore, this.opponentScore);
            }
            this.trophies = typeof this.tournament.getCareerStats === 'function'
                ? this.tournament.getCareerStats().trophies
                : (this.tournament.careerTrophies || 0);
            if (this.elTrophyCount) this.elTrophyCount.textContent = this.trophies;
        }


        if (goScorePlayer) goScorePlayer.textContent = this.playerScore;
        if (goScoreOpponent) goScoreOpponent.textContent = this.opponentScore;

        let pName, oppName;
        if (this.gameMode === 'tournament') {
            pName = window.i18n ? window.i18n.getCountryName(this.playerCountry.code) : this.playerCountry.name;
            oppName = window.i18n ? window.i18n.getCountryName(this.opponentCountry.code) : this.opponentCountry.name;
        } else {
            pName = window.i18n ? window.i18n.t('player_label') : this.playerCountry.name;
            oppName = window.i18n ? (window.i18n.t('enemy_label') || this.opponentCountry.name) : this.opponentCountry.name;
        }

        const goPlayerFlag = document.getElementById('go-flag-player');
        const goOppFlag = document.getElementById('go-flag-opponent');
        const goPlayerTeam = document.getElementById('go-team-player');
        const goOppTeam = document.getElementById('go-team-opponent');
        if (goPlayerFlag) goPlayerFlag.src = this.playerCountry.flag;
        if (goOppFlag) goOppFlag.src = this.opponentCountry.flag;
        if (goPlayerTeam) goPlayerTeam.textContent = pName.toUpperCase();
        if (goOppTeam) goOppTeam.textContent = oppName.toUpperCase();

        if (winner === 'player') {
            if (this.elTrophyCount) this.elTrophyCount.textContent = this.trophies;
            if (iconEl) { iconEl.textContent = '🏆'; iconEl.className = 'game-over-icon win'; }
            if (gameOverCard) gameOverCard.classList.remove('lose');

            if (this.gameMode === 'tournament') {
                const totalStages = this.tournament && this.tournament.stages ? this.tournament.stages.length : 3;
                if (this.tournament && this.tournament.currentStageIndex >= totalStages) {

                    if (title) {
                        title.textContent = window.i18n ? window.i18n.t('tourney_champion_title') : '🏆 DÜNYA ŞAMPİYONU OLDUN! 🏆';
                        title.style.color = '#ffd700';
                    }
                    if (desc) {
                        desc.textContent = window.i18n
                            ? window.i18n.t('tourney_champion_desc', { country: pName, player: this.playerScore, opponent: this.opponentScore })
                            : `${pName} ile Table Tennis Reflex Dünya Kupası'nı kaldırdın! Final Skoru: ${this.playerScore} - ${this.opponentScore}`;
                    }
                    if (advanceBtn) {
                        advanceBtn.classList.remove('hidden');
                        if (advanceBtnText) advanceBtnText.textContent = window.i18n ? window.i18n.t('btn_tournament_celebrate') : 'KUPAYI KUTLA 🏆';
                    }
                } else {

                    const nextStage = this.tournament ? this.tournament.getCurrentStage() : null;
                    if (title) {
                        title.textContent = window.i18n ? window.i18n.t('tourney_round_won_title') : 'TURU GEÇTİN! 🏓';
                        title.style.color = '#ffd700';
                    }
                    if (desc) {
                        desc.textContent = window.i18n
                            ? window.i18n.t('tourney_round_won_desc', { opponent: oppName, player: this.playerScore, opponentScore: this.opponentScore })
                            : `${oppName} karşısında muhteşem bir zafer! Skor: ${this.playerScore} - ${this.opponentScore}`;
                    }
                    if (advanceBtn) {
                        advanceBtn.classList.remove('hidden');
                        if (advanceBtnText) advanceBtnText.textContent = window.i18n ? window.i18n.t('btn_tournament_advance') : 'TURNUVA AĞACINA GEÇ ➔';
                    }
                }
            } else {

                if (title) {
                    title.textContent = window.i18n ? window.i18n.t('match_won_title') : 'TEBRİKLER, KAZANDIN! 🏆';
                    title.style.color = '#ffd700';
                }
                if (desc) {
                    desc.textContent = window.i18n
                        ? window.i18n.t('match_won_desc', { player: this.playerScore, opponent: this.opponentScore })
                        : `Muhteşem bir maç! Skor: ${this.playerScore} - ${this.opponentScore}`;
                }
                if (advanceBtn) advanceBtn.classList.add('hidden');
            }
        } else {
            if (iconEl) { iconEl.textContent = '💔'; iconEl.className = 'game-over-icon lose'; }
            if (gameOverCard) gameOverCard.classList.add('lose');

            if (this.gameMode === 'tournament') {
                if (title) {
                    title.textContent = window.i18n ? window.i18n.t('tourney_eliminated_title') : 'TURNUVADAN ELENDİN!';
                    title.style.color = '#ff5252';
                }
                if (desc) {
                    desc.textContent = window.i18n
                        ? window.i18n.t('tourney_eliminated_desc', { opponent: oppName, player: this.playerScore, opponentScore: this.opponentScore })
                        : `${oppName} karşısında maç kaybedildi. Skor: ${this.playerScore} - ${this.opponentScore}. Tekrar dene!`;
                }
                if (advanceBtn) {
                    advanceBtn.classList.remove('hidden');
                    if (advanceBtnText) advanceBtnText.textContent = window.i18n ? window.i18n.t('btn_tournament_view_bracket') : 'TURNUVA AĞACINI GÖRÜNTÜLE ➔';
                }
            } else {

                if (title) {
                    title.textContent = window.i18n ? window.i18n.t('match_lost_title') : 'MAÇI KAYBETTİN!';
                    title.style.color = '#ff5252';
                }
                if (desc) {
                    desc.textContent = window.i18n
                        ? window.i18n.t('match_lost_desc', { player: this.playerScore, opponent: this.opponentScore })
                        : `Tekrar dene ve şampiyon ol! Skor: ${this.playerScore} - ${this.opponentScore}`;
                }
                if (advanceBtn) advanceBtn.classList.add('hidden');
            }
        }

        this.renderArcadeMatchReport(winner);
        this.renderProMatchReport();
        this.elGameOverModal.classList.remove('hidden');
    }

    animate(currentTime) {
        requestAnimationFrame(this.animate);

        if (this.state === 'paused') {

            this.lastTime = currentTime;
            this.renderer.renderOnly();
            return;
        }



        if (this.physicsProfile === 'arcade' && currentTime < (this.arcadeHitStopUntil || 0)) {
            this.lastTime = currentTime;
            this.renderer.renderOnly();
            return;
        }

        const dt = Math.min(0.04, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;


        this.physics.update(dt);


        this.controller.update(dt);
        this.ai.update(dt);


        if (this.physics.inPlay) {
            const ball = this.physics.pos;
            const lastHitter = this.physics.lastHitter;


            const bounces = this.physics.bouncesSinceHit;
            const isOutsideTableX = Math.abs(ball.x) > 0.85;
            const isOutsideTableZ = Math.abs(ball.z) > 1.45;
            const isBelowTable = ball.y < 0.72;
            const isFloorOrFar = ball.y <= this.physics.RADIUS + 0.05 || Math.abs(ball.z) > 2.9 || Math.abs(ball.x) > 2.4;



            if ((bounces === 0 && (isOutsideTableX || isOutsideTableZ) && isBelowTable) || isFloorOrFar) {
                if (this.isServe && this.physics.bounceHistory.length < 2) {
                    const faultMsg = window.i18n ? window.i18n.t('fault_serve') : 'Hatalı Servis!';
                    this.awardPoint(lastHitter === 'player' ? 'opponent' : 'player', faultMsg);
                } else if (bounces === 0) {
                    if (lastHitter === 'player') this.markProTechniqueOutcome('out');
                    const outMsg = window.i18n ? window.i18n.t('fault_out_of_bounds') : 'Dışarı Çıktı (Out)!';
                    this.awardPoint(lastHitter === 'player' ? 'opponent' : 'player', outMsg);
                } else {
                    const ptMsg = window.i18n ? window.i18n.t('point_generic') : 'Sayı!';
                    this.awardPoint(lastHitter, ptMsg);
                }
            }
        }


        this.renderer.update(
            dt,
            this.physics.pos,
            this.controller.pos,
            this.controller.rot,
            this.ai.pos,
            this.ai.rot
        );
    }
}

window.TableTennisGame = TableTennisGame;

window.addEventListener('DOMContentLoaded', () => {
    new TableTennisGame();
});
