






class TableTennisTournament {
    constructor() {
        this.COUNTRIES = {
            tr: { code: 'tr', name: 'Türkiye', flag: 'assets/tr.svg', style: 'Hızlı Kontra', rating: 91, archetype: 'speed_counter' },
            cn: { code: 'cn', name: 'Çin', flag: 'assets/cn.svg', style: 'Dünya Devi & Kusursuz', rating: 99, archetype: 'titan' },
            jp: { code: 'jp', name: 'Japonya', flag: 'assets/jp.svg', style: 'Süper Refleks', rating: 95, archetype: 'speed_counter' },
            de: { code: 'de', name: 'Almanya', flag: 'assets/de.svg', style: 'Taktiksel Blok & Kesme', rating: 93, archetype: 'defensive_wall' },
            se: { code: 'se', name: 'İsveç', flag: 'assets/se.svg', style: 'Efsane Yan Spin', rating: 92, archetype: 'spin_loop' },
            fr: { code: 'fr', name: 'Fransa', flag: 'assets/fr.svg', style: 'Agresif Hücum', rating: 90, archetype: 'power_attack' },
            kr: { code: 'kr', name: 'Güney Kore', flag: 'assets/kr.svg', style: 'Yıldırım Kontra', rating: 92, archetype: 'speed_counter' },
            br: { code: 'br', name: 'Brezilya', flag: 'assets/br.svg', style: 'Güçlü Forehand Looper', rating: 90, archetype: 'spin_loop' },
            us: { code: 'us', name: 'ABD', flag: 'assets/us.svg', style: 'Modern Sert Ralli', rating: 88, archetype: 'power_attack' },
            gb: { code: 'gb', name: 'İngiltere', flag: 'assets/gb.svg', style: 'Klasik Savunma', rating: 87, archetype: 'defensive_wall' },
            ng: { code: 'ng', name: 'Nijerya', flag: 'assets/ng.svg', style: 'Yıkıcı Forehand Smaç', rating: 89, archetype: 'power_attack' },
            es: { code: 'es', name: 'İspanya', flag: 'assets/es.svg', style: 'Solak Spin & Hassasiyet', rating: 88, archetype: 'spin_loop' },
            in: { code: 'in', name: 'Hindistan', flag: 'assets/in.svg', style: 'Hızlı Bilek & Kontra', rating: 87, archetype: 'speed_counter' },
            tw: { code: 'tw', name: 'Tayvan', flag: 'assets/tw.svg', style: 'Sessiz Suikastçı & Chiquita', rating: 94, archetype: 'titan' },
            at: { code: 'at', name: 'Avusturya', flag: 'assets/at.svg', style: 'Taktik Kesme & Blok', rating: 89, archetype: 'defensive_wall' },
            it: { code: 'it', name: 'İtalya', flag: 'assets/it.svg', style: 'Dinamik Hücum', rating: 87, archetype: 'power_attack' }
        };

        this.TOURNAMENT_TYPES = {
            masters: {
                id: 'masters',
                nameKey: 'tourney_masters_name',
                nameFallback: 'MASTERS KUPASI (8 ÜLKE)',
                numTeams: 8,
                stages: [
                    { id: 'qf', nameKey: 'stage_qf', nameFallback: 'ÇEYREK FİNAL', diff: 'medium' },
                    { id: 'sf', nameKey: 'stage_sf', nameFallback: 'YARI FİNAL', diff: 'medium' },
                    { id: 'fn', nameKey: 'stage_fn', nameFallback: 'BÜYÜK FİNAL', diff: 'hard' }
                ]
            },
            world: {
                id: 'world',
                nameKey: 'tourney_world_name',
                nameFallback: 'DÜNYA ŞAMPİYONASI (16 ÜLKE)',
                numTeams: 16,
                stages: [
                    { id: 'r16', nameKey: 'stage_r16', nameFallback: 'SON 16 TURU', diff: 'medium' },
                    { id: 'qf', nameKey: 'stage_qf', nameFallback: 'ÇEYREK FİNAL', diff: 'medium' },
                    { id: 'sf', nameKey: 'stage_sf', nameFallback: 'YARI FİNAL', diff: 'hard' },
                    { id: 'fn', nameKey: 'stage_fn', nameFallback: 'DÜNYA FİNALİ', diff: 'hard' }
                ]
            }
        };

        this.tournamentType = 'world';
        this.difficulty = 'medium';
        this.playerCountry = 'tr';
        this.currentStageIndex = 0;
        this.isCareerActive = true;
        this.bracket = null;
        this.careerTrophies = 0;


        this.careerStats = {
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            trophiesMasters: 0,
            trophiesWorld: 0,
            totalPointsWon: 0,
            totalPointsLost: 0,
            highestRally: 0,
            goldMedals: 0,
            silverMedals: 0
        };

        this.load();
    }

    startNewTournament(playerCode, tourneyType = null, chosenDifficulty = null) {
        if (!this.COUNTRIES[playerCode]) playerCode = 'tr';
        if (tourneyType && this.TOURNAMENT_TYPES[tourneyType]) {
            this.tournamentType = tourneyType;
        }
        if (chosenDifficulty && ['easy', 'medium', 'hard'].includes(chosenDifficulty)) {
            this.difficulty = chosenDifficulty;
        } else if (!this.difficulty) {
            this.difficulty = 'medium';
        }
        this.playerCountry = playerCode;
        this.currentStageIndex = 0;
        this.isCareerActive = true;

        const config = this.TOURNAMENT_TYPES[this.tournamentType] || this.TOURNAMENT_TYPES.world;
        const totalOpponentsNeeded = config.numTeams - 1;

        const pool = Object.keys(this.COUNTRIES).filter(c => c !== playerCode);


        let finalBoss = (playerCode === 'cn') ? 'jp' : 'cn';
        let remainingPool = pool.filter(c => c !== finalBoss);


        remainingPool.sort(() => Math.random() - 0.5);

        if (this.tournamentType === 'world') {


            const selected = [...remainingPool];
            selected.sort(() => Math.random() - 0.5);

            const r16Opponent = selected.pop() || 'fr';


            const r16Matches = [
                { id: 'm1', p1: playerCode, p2: r16Opponent, winner: null, score: null, isPlayer: true }
            ];

            for (let i = 2; i <= 7; i++) {
                const p1 = selected.pop() || 'de';
                const p2 = selected.pop() || 'se';
                r16Matches.push({ id: `m${i}`, p1, p2, winner: null, score: null, isPlayer: false });
            }

            const m8Opponent = selected.pop() || 'br';
            r16Matches.push({ id: 'm8', p1: finalBoss, p2: m8Opponent, winner: null, score: null, isPlayer: false });

            this.bracket = {
                r16: r16Matches,
                qf: [
                    { id: 'qf1', p1: null, p2: null, winner: null, score: null, isPlayer: true },
                    { id: 'qf2', p1: null, p2: null, winner: null, score: null, isPlayer: false },
                    { id: 'qf3', p1: null, p2: null, winner: null, score: null, isPlayer: false },
                    { id: 'qf4', p1: null, p2: null, winner: null, score: null, isPlayer: false }
                ],
                sf: [
                    { id: 'sf1', p1: null, p2: null, winner: null, score: null, isPlayer: true },
                    { id: 'sf2', p1: null, p2: null, winner: null, score: null, isPlayer: false }
                ],
                fn: [
                    { id: 'fn1', p1: null, p2: null, winner: null, score: null, isPlayer: true }
                ]
            };

        } else {


            const selected = remainingPool.slice(0, 6);
            selected.sort(() => Math.random() - 0.5);

            const qfOpponent = selected.pop() || 'fr';
            const qf2A = selected.pop() || 'de';
            const qf2B = selected.pop() || 'us';
            const qf3A = selected.pop() || 'jp';
            const qf3B = selected.pop() || 'gb';
            const qf4A = finalBoss;
            const qf4B = selected.pop() || 'br';

            this.bracket = {
                qf: [
                    { id: 'm1', p1: playerCode, p2: qfOpponent, winner: null, score: null, isPlayer: true },
                    { id: 'm2', p1: qf2A, p2: qf2B, winner: null, score: null, isPlayer: false },
                    { id: 'm3', p1: qf3A, p2: qf3B, winner: null, score: null, isPlayer: false },
                    { id: 'm4', p1: qf4A, p2: qf4B, winner: null, score: null, isPlayer: false }
                ],
                sf: [
                    { id: 'sf1', p1: null, p2: null, winner: null, score: null, isPlayer: true },
                    { id: 'sf2', p1: null, p2: null, winner: null, score: null, isPlayer: false }
                ],
                fn: [
                    { id: 'fn1', p1: null, p2: null, winner: null, score: null, isPlayer: true }
                ]
            };
        }

        this.save();
    }

    get stages() {
        return this.getStages();
    }

    getStages() {
        const typeConfig = this.TOURNAMENT_TYPES[this.tournamentType] || this.TOURNAMENT_TYPES.world;
        return typeConfig.stages;
    }

    getTotalStages() {
        return this.getStages().length;
    }

    getCurrentStage() {
        const stages = this.getStages();
        if (this.currentStageIndex >= stages.length) {
            return { id: 'champ', nameKey: 'stage_champ', nameFallback: 'DÜNYA ŞAMPİYONU 🏆', diff: this.difficulty || 'hard' };
        }
        const s = stages[this.currentStageIndex];
        return { ...s, diff: this.difficulty || s.diff };
    }

    getCurrentMatch() {
        if (!this.bracket) return null;
        if (this.tournamentType === 'world') {
            if (this.currentStageIndex === 0) return this.bracket.r16 ? this.bracket.r16[0] : null;
            if (this.currentStageIndex === 1) return this.bracket.qf ? this.bracket.qf[0] : null;
            if (this.currentStageIndex === 2) return this.bracket.sf ? this.bracket.sf[0] : null;
            if (this.currentStageIndex === 3) return this.bracket.fn ? this.bracket.fn[0] : null;
        } else {
            if (this.currentStageIndex === 0) return this.bracket.qf ? this.bracket.qf[0] : null;
            if (this.currentStageIndex === 1) return this.bracket.sf ? this.bracket.sf[0] : null;
            if (this.currentStageIndex === 2) return this.bracket.fn ? this.bracket.fn[0] : null;
        }
        return null;
    }

    getCurrentOpponent() {
        const match = this.getCurrentMatch();
        if (!match) {
            if (this.bracket && this.bracket.fn && this.bracket.fn[0]) {
                const fn = this.bracket.fn[0];
                const oppCode = fn.p1 === this.playerCountry ? fn.p2 : fn.p1;
                if (oppCode && this.COUNTRIES[oppCode]) return this.COUNTRIES[oppCode];
            }
            return this.COUNTRIES['cn'] || this.COUNTRIES['us'];
        }
        const oppCode = match.p1 === this.playerCountry ? match.p2 : match.p1;
        return this.COUNTRIES[oppCode] || this.COUNTRIES['cn'];
    }

    getPlayerCountry() {
        return this.COUNTRIES[this.playerCountry] || this.COUNTRIES['tr'];
    }

    simulateMatch(p1Code, p2Code) {
        if (!p1Code || !p2Code) return { winner: p1Code || p2Code, score: '11 - 9' };
        const c1 = this.COUNTRIES[p1Code] || { rating: 88 };
        const c2 = this.COUNTRIES[p2Code] || { rating: 88 };


        const ratingDiff = c1.rating - c2.rating;
        const p1WinProb = 0.50 + (ratingDiff * 0.035);
        const p1Wins = Math.random() < Math.max(0.18, Math.min(0.82, p1WinProb));

        const loserScore = 6 + Math.floor(Math.random() * 4);
        return {
            winner: p1Wins ? p1Code : p2Code,
            score: p1Wins ? `11 - ${loserScore}` : `${loserScore} - 11`
        };
    }

    recordQuickMatchResult(winner, playerScore, opponentScore) {
        this.careerStats.matchesPlayed++;
        this.careerStats.totalPointsWon += (Number(playerScore) || 0);
        this.careerStats.totalPointsLost += (Number(opponentScore) || 0);
        if (winner === 'player') {
            this.careerStats.matchesWon++;
        } else {
            this.careerStats.matchesLost++;
        }
        this.save();
    }

    recordMatchResult(winner, playerScore, opponentScore) {

        this.careerStats.matchesPlayed++;
        this.careerStats.totalPointsWon += (Number(playerScore) || 0);
        this.careerStats.totalPointsLost += (Number(opponentScore) || 0);
        if (winner === 'player') {
            this.careerStats.matchesWon++;
        } else {
            this.careerStats.matchesLost++;
        }

        if (!this.isCareerActive || !this.bracket) {
            this.save();
            return;
        }
        const match = this.getCurrentMatch();
        if (!match) {
            this.save();
            return;
        }

        const opp = this.getCurrentOpponent();
        match.winner = winner === 'player' ? this.playerCountry : opp.code;
        match.score = `${playerScore} - ${opponentScore}`;

        const stages = this.getStages();
        const totalRounds = stages.length;

        if (this.tournamentType === 'world') {
            if (this.currentStageIndex === 0) {

                for (let i = 1; i < this.bracket.r16.length; i++) {
                    const m = this.bracket.r16[i];
                    if (!m.winner) {
                        const sim = this.simulateMatch(m.p1, m.p2);
                        m.winner = sim.winner;
                        m.score = sim.score;
                    }
                }


                this.bracket.qf[1].p1 = this.bracket.r16[2].winner || this.bracket.r16[2].p1;
                this.bracket.qf[1].p2 = this.bracket.r16[3].winner || this.bracket.r16[3].p1;
                this.bracket.qf[2].p1 = this.bracket.r16[4].winner || this.bracket.r16[4].p1;
                this.bracket.qf[2].p2 = this.bracket.r16[5].winner || this.bracket.r16[5].p1;
                this.bracket.qf[3].p1 = this.bracket.r16[6].winner || this.bracket.r16[6].p1;
                this.bracket.qf[3].p2 = this.bracket.r16[7].winner || this.bracket.r16[7].p1;
                this.bracket.qf[0].p2 = this.bracket.r16[1].winner || this.bracket.r16[1].p1;

                if (winner === 'player') {
                    this.currentStageIndex = 1;
                    this.bracket.qf[0].p1 = this.playerCountry;
                    this.bracket.qf[0].winner = null;
                    this.bracket.qf[0].score = null;
                }

            } else if (this.currentStageIndex === 1) {

                for (let i = 1; i < this.bracket.qf.length; i++) {
                    const m = this.bracket.qf[i];
                    if (!m.winner) {
                        const sim = this.simulateMatch(m.p1, m.p2);
                        m.winner = sim.winner;
                        m.score = sim.score;
                    }
                }


                this.bracket.sf[1].p1 = this.bracket.qf[2].winner || this.bracket.qf[2].p1;
                this.bracket.sf[1].p2 = this.bracket.qf[3].winner || this.bracket.qf[3].p1;
                this.bracket.sf[0].p2 = this.bracket.qf[1].winner || this.bracket.qf[1].p1;

                if (winner === 'player') {
                    this.currentStageIndex = 2;
                    this.bracket.sf[0].p1 = this.playerCountry;
                    this.bracket.sf[0].winner = null;
                    this.bracket.sf[0].score = null;
                }

            } else if (this.currentStageIndex === 2) {

                const sf2 = this.bracket.sf[1];
                if (!sf2.winner) {
                    const sim = this.simulateMatch(sf2.p1, sf2.p2);
                    sf2.winner = sim.winner;
                    sf2.score = sim.score;
                }
                this.bracket.fn[0].p2 = sf2.winner || sf2.p1;

                if (winner === 'player') {
                    this.currentStageIndex = 3;
                    this.bracket.fn[0].p1 = this.playerCountry;
                    this.bracket.fn[0].winner = null;
                    this.bracket.fn[0].score = null;
                }

            } else if (this.currentStageIndex === 3) {
                if (winner === 'player') {

                    this.currentStageIndex = 4;
                    this.careerTrophies += 1;
                    this.careerStats.trophiesWorld += 1;
                    this.careerStats.goldMedals += 1;
                } else {

                    this.careerStats.silverMedals += 1;
                }
            }

        } else {

            if (this.currentStageIndex === 0) {
                for (let i = 1; i < this.bracket.qf.length; i++) {
                    const m = this.bracket.qf[i];
                    if (!m.winner) {
                        const sim = this.simulateMatch(m.p1, m.p2);
                        m.winner = sim.winner;
                        m.score = sim.score;
                    }
                }

                this.bracket.sf[1].p1 = this.bracket.qf[2].winner || this.bracket.qf[2].p1;
                this.bracket.sf[1].p2 = this.bracket.qf[3].winner || this.bracket.qf[3].p1;
                this.bracket.sf[0].p2 = this.bracket.qf[1].winner || this.bracket.qf[1].p1;

                if (winner === 'player') {
                    this.currentStageIndex = 1;
                    this.bracket.sf[0].p1 = this.playerCountry;
                    this.bracket.sf[0].winner = null;
                    this.bracket.sf[0].score = null;
                }

            } else if (this.currentStageIndex === 1) {
                const sf2 = this.bracket.sf[1];
                if (!sf2.winner) {
                    const sim = this.simulateMatch(sf2.p1, sf2.p2);
                    sf2.winner = sim.winner;
                    sf2.score = sim.score;
                }
                this.bracket.fn[0].p2 = sf2.winner || sf2.p1;

                if (winner === 'player') {
                    this.currentStageIndex = 2;
                    this.bracket.fn[0].p1 = this.playerCountry;
                    this.bracket.fn[0].winner = null;
                    this.bracket.fn[0].score = null;
                }

            } else if (this.currentStageIndex === 2) {
                if (winner === 'player') {

                    this.currentStageIndex = 3;
                    this.careerTrophies += 1;
                    this.careerStats.trophiesMasters += 1;
                    this.careerStats.goldMedals += 1;
                } else {

                    this.careerStats.silverMedals += 1;
                }
            }
        }

        this.save();
    }

    retryCurrentStage() {
        const match = this.getCurrentMatch();
        if (match) {




            const stage = this.getCurrentStage();
            const lostFinal = stage && stage.id === 'fn' && match.winner && match.winner !== this.playerCountry;
            if (lostFinal && this.careerStats.silverMedals > 0) {
                this.careerStats.silverMedals -= 1;
            }
            match.winner = null;
            match.score = null;
            this.save();
        }
    }

    getScoutingReport(countryCode) {
        const country = this.COUNTRIES[countryCode] || this.COUNTRIES['cn'];
        const arch = country.archetype || 'power_attack';

        const archetypeProfiles = {
            titan: {
                id: 'titan',
                nameKey: 'arch_titan_title',
                nameFallback: 'DÜNYA DEVİ / KUSURSUZ ŞAMPİYON',
                speed: 98,
                spin: 96,
                power: 95,
                defense: 94,
                strengthsKey: 'arch_titan_strengths',
                strengthsFallback: 'Kusursuz masa okuma, ölümcül muz topspini (Chiquita), sıfıra yakın hata',
                weaknessesKey: 'arch_titan_weaknesses',
                weaknessesFallback: 'Aşırı hızlı düz bloklarda bazen fazla risk alabilir, Gövdeye sıkıştırılan ani bloklara zorlanabilir',
                tacticsKey: 'arch_titan_tactics',
                tacticsFallback: 'Ortaya doğru sert bloklar yap, köşeleri erken açma ve smacı bulunca tereddüt etme!'
            },
            speed_counter: {
                id: 'speed_counter',
                nameKey: 'arch_counter_title',
                nameFallback: 'YILDIRIM KONTRACI',
                speed: 97,
                spin: 86,
                power: 88,
                defense: 91,
                strengthsKey: 'arch_counter_strengths',
                strengthsFallback: 'Masaya yapışık refleks, anında ters köşe kontra-drive, ultra hızlı reaksiyon',
                weaknessesKey: 'arch_counter_weaknesses',
                weaknessesFallback: 'Yüksek ve ağır yan spinli toplarda vuruş açısı bozulur, Masadan geriye açıldığında etkisi azalır',
                tacticsKey: 'arch_counter_tactics',
                tacticsFallback: 'Kavisli ve bol yan spinli toplar at, hız yarışına girmek yerine açıyı genişlet!'
            },
            spin_loop: {
                id: 'spin_loop',
                nameKey: 'arch_spin_title',
                nameFallback: 'SPİN CAMBAZI / AĞIR LOOPER',
                speed: 89,
                spin: 98,
                power: 87,
                defense: 90,
                strengthsKey: 'arch_spin_strengths',
                strengthsFallback: 'Yere sekince yana ve ileri fırlayan devasa falso, dip çizgiyi bulan kavisler',
                weaknessesKey: 'arch_spin_weaknesses',
                weaknessesFallback: 'Masadan geriye açıldığı için kısa toplara yetişemez, Doğrudan gövdeye gelen sert şutlara karşı zorlanır',
                tacticsKey: 'arch_spin_tactics',
                tacticsFallback: 'Geriye çekildiğinde kısa bırakışlar (Drop Shot) ve masanın ortasına direkt hızlı vuruşlar yap!'
            },
            defensive_wall: {
                id: 'defensive_wall',
                nameKey: 'arch_wall_title',
                nameFallback: 'DEFANS DUVARI / KESMECİ (CHOPPER)',
                speed: 86,
                spin: 94,
                power: 82,
                defense: 99,
                strengthsKey: 'arch_wall_strengths',
                strengthsFallback: 'Ağır backspin (kesme), gelen her şutu geri çeviren çelik blok, sabırlı ralli',
                weaknessesKey: 'arch_wall_weaknesses',
                weaknessesFallback: 'Ani hızlanan sert şutlara karşı hücum üretemez, Pasif kaldığında file önü toplara geç kalabilir',
                tacticsKey: 'arch_wall_tactics',
                tacticsFallback: 'Kesme topların masada alçalacağını unutma! Top yükseldiği an hiç beklemeden smaçla bitir!'
            },
            power_attack: {
                id: 'power_attack',
                nameKey: 'arch_power_title',
                nameFallback: 'YIKICI HÜCUMCU / GÜÇ BOMBARDIMANI',
                speed: 92,
                spin: 88,
                power: 99,
                defense: 83,
                strengthsKey: 'arch_power_strengths',
                strengthsFallback: 'Ağır roket smaçlar, öldürücü forehand hücumları, kesintisiz hücum baskısı',
                weaknessesKey: 'arch_power_weaknesses',
                weaknessesFallback: 'Hücum yaparken savunma dengesini kaybeder, Ters köşe kontralara karşı savunmasızdır',
                tacticsKey: 'arch_power_tactics',
                tacticsFallback: 'Smaçlarını sakin karşıla ve rakibin boş bıraktığı ters köşeye yönlendir!'
            }
        };

        const prof = archetypeProfiles[arch] || archetypeProfiles.power_attack;
        const strengths = prof.strengthsFallback ? prof.strengthsFallback.split(',').map(s => s.trim()) : [];
        const weaknesses = prof.weaknessesFallback ? prof.weaknessesFallback.split(',').map(w => w.trim()) : [];

        return {
            country,
            archetype: arch,
            profile: prof,
            flag: country.flag,
            name: country.name,
            style: country.style,
            rating: country.rating,
            ratings: {
                speed: prof.speed,
                spin: prof.spin,
                power: prof.power,
                defense: prof.defense
            },
            strengths,
            weaknesses,
            tip: prof.tacticsFallback
        };
    }

    getAiModifiers(countryCode) {
        const country = this.COUNTRIES[countryCode] || this.COUNTRIES['cn'];
        const arch = country.archetype || 'power_attack';

        const mods = {
            archetype: arch,
            speedMult: 1.0,
            reactionDelayMult: 1.0,
            topspinBonus: 0,
            sidespinBonus: 0,
            attackChanceMult: 1.0
        };

        if (countryCode === 'cn') {
            mods.speedMult = 1.06;
            mods.topspinBonus = 14;
            mods.reactionDelayMult = 0.85;
            mods.attackChanceMult = 1.25;
        } else if (countryCode === 'jp') {
            mods.reactionDelayMult = 0.80;
            mods.speedMult = 1.05;
        } else if (countryCode === 'de') {
            mods.topspinBonus = -6;
            mods.reactionDelayMult = 0.88;
        } else if (countryCode === 'se') {
            mods.sidespinBonus = 10;
            mods.topspinBonus = 16;
        } else if (countryCode === 'fr') {
            mods.attackChanceMult = 1.30;
        } else if (countryCode === 'kr') {
            mods.attackChanceMult = 1.25;
            mods.speedMult = 1.04;
        } else if (countryCode === 'br') {
            mods.topspinBonus = 14;
            mods.sidespinBonus = 6;
        } else if (countryCode === 'ng') {
            mods.attackChanceMult = 1.45;
            mods.speedMult = 1.03;
        } else if (countryCode === 'es') {
            mods.sidespinBonus = 8;
            mods.topspinBonus = 12;
        } else if (countryCode === 'in') {
            mods.reactionDelayMult = 0.85;
            mods.speedMult = 1.02;
        } else if (countryCode === 'tw') {
            mods.speedMult = 1.05;
            mods.topspinBonus = 12;
            mods.reactionDelayMult = 0.86;
        } else if (countryCode === 'at') {
            mods.topspinBonus = -8;
            mods.reactionDelayMult = 0.89;
        } else if (countryCode === 'it') {
            mods.attackChanceMult = 1.20;
        }

        return mods;
    }

    recordHighestRally(rally) {
        if (typeof rally === 'number' && rally > this.careerStats.highestRally) {
            this.careerStats.highestRally = rally;
            this.save();
        }
    }

    getCareerStats() {
        const matches = this.careerStats.matchesPlayed || 0;
        const wins = this.careerStats.matchesWon || 0;
        const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
        const tourneyTrophies = Math.max(
            this.careerTrophies || 0,
            (this.careerStats.trophiesMasters || 0) + (this.careerStats.trophiesWorld || 0),
            this.careerStats.goldMedals || 0
        );
        this.careerTrophies = tourneyTrophies;
        return {
            trophies: tourneyTrophies,
            matchesPlayed: matches,
            matchesWon: wins,
            matchesLost: this.careerStats.matchesLost || 0,
            winRate,
            totalPointsScored: this.careerStats.totalPointsWon || 0,
            highestRally: this.careerStats.highestRally || 0,
            goldMedals: this.careerStats.goldMedals || 0,
            silverMedals: this.careerStats.silverMedals || 0
        };
    }


    isValidSavedBracket(bracket, tournamentType, playerCountry, currentStageIndex) {
        if (!bracket || typeof bracket !== 'object') return false;
        const expected = tournamentType === 'masters'
            ? { qf: 4, sf: 2, fn: 1 }
            : { r16: 8, qf: 4, sf: 2, fn: 1 };
        const hasCountry = (code) => typeof code === 'string' && Object.prototype.hasOwnProperty.call(this.COUNTRIES, code);
        const validCodeOrNull = (code) => code == null || hasCountry(code);
        const validMatch = (match) => {
            if (!match || typeof match !== 'object' || typeof match.id !== 'string' || !match.id) return false;
            if (!validCodeOrNull(match.p1) || !validCodeOrNull(match.p2) || !validCodeOrNull(match.winner)) return false;
            if (match.p1 != null && match.p2 != null && match.p1 === match.p2) return false;

            if (match.winner != null && match.winner !== match.p1 && match.winner !== match.p2) return false;
            if (match.score != null && typeof match.score !== 'string') return false;
            if (match.winner == null && match.score != null) return false;
            if (match.winner != null && match.score == null) return false;
            return true;
        };

        for (const [round, size] of Object.entries(expected)) {
            if (!Array.isArray(bracket[round]) || bracket[round].length !== size) return false;
            if (!bracket[round].every(validMatch)) return false;
        }

        const config = this.TOURNAMENT_TYPES[tournamentType];
        if (!config || !Number.isInteger(currentStageIndex) || currentStageIndex < 0 || currentStageIndex > config.stages.length) return false;
        if (!hasCountry(playerCountry)) return false;




        const openingRoundId = tournamentType === 'masters' ? 'qf' : 'r16';
        const openingParticipants = [];
        for (const match of bracket[openingRoundId]) {
            if (!hasCountry(match.p1) || !hasCountry(match.p2)) return false;
            openingParticipants.push(match.p1, match.p2);
        }
        if (new Set(openingParticipants).size !== openingParticipants.length) return false;
        if (!openingParticipants.includes(playerCountry)) return false;



        if (currentStageIndex < config.stages.length) {
            const roundId = config.stages[currentStageIndex].id;
            const playerMatch = bracket[roundId] && bracket[roundId][0];
            if (!playerMatch || !hasCountry(playerMatch.p1) || !hasCountry(playerMatch.p2)) return false;
            const playerSlots = Number(playerMatch.p1 === playerCountry) + Number(playerMatch.p2 === playerCountry);
            if (playerSlots !== 1) return false;
        } else {


            const finalMatch = bracket.fn && bracket.fn[0];
            if (!finalMatch || finalMatch.winner !== playerCountry) return false;
        }
        return true;
    }

    sanitizeCareerStats(stats) {
        if (!stats || typeof stats !== 'object') return;
        for (const key of Object.keys(this.careerStats)) {
            const value = Number(stats[key]);
            if (Number.isFinite(value) && value >= 0) this.careerStats[key] = Math.floor(value);
        }
    }

    save() {
        try {
            const data = {
                tournamentType: this.tournamentType,
                playerCountry: this.playerCountry,
                difficulty: this.difficulty || 'medium',
                currentStageIndex: this.currentStageIndex,
                isCareerActive: this.isCareerActive,
                bracket: this.bracket,
                careerTrophies: this.careerTrophies,
                careerStats: this.careerStats
            };
            localStorage.setItem('tt_career_data', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save career data to localStorage', e);
        }
    }

    load() {
        let fallbackPlayer = 'tr';
        let fallbackType = 'world';
        let fallbackDifficulty = 'medium';
        try {
            const raw = localStorage.getItem('tt_career_data');
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    fallbackType = this.TOURNAMENT_TYPES[data.tournamentType] ? data.tournamentType : 'world';
                    fallbackPlayer = this.COUNTRIES[data.playerCountry] ? data.playerCountry : 'tr';
                    fallbackDifficulty = ['easy', 'medium', 'hard'].includes(data.difficulty) ? data.difficulty : 'medium';


                    const trophies = Number(data.careerTrophies);
                    if (Number.isFinite(trophies) && trophies >= 0) this.careerTrophies = Math.floor(trophies);
                    this.sanitizeCareerStats(data.careerStats);

                    const stageIndex = Number.isInteger(data.currentStageIndex) ? data.currentStageIndex : 0;
                    if (this.isValidSavedBracket(data.bracket, fallbackType, fallbackPlayer, stageIndex)) {
                        this.tournamentType = fallbackType;
                        this.playerCountry = fallbackPlayer;
                        this.difficulty = fallbackDifficulty;
                        this.currentStageIndex = stageIndex;
                        this.isCareerActive = data.isCareerActive !== false;
                        this.bracket = data.bracket;
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Could not load career data from localStorage', e);
        }

        this.startNewTournament(fallbackPlayer, fallbackType, fallbackDifficulty);
    }
}

window.TableTennisTournament = TableTennisTournament;

