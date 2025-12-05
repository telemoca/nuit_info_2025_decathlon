// On attend que le DOM soit chargé pour éviter les erreurs "null"
document.addEventListener("DOMContentLoaded", () => {
    // Variables de gestion d'état
    let currentStep = 1
    const totalSteps = 6
    const progressBar = document.getElementById("progressBar")
    let isAnimating = false // Sécurité pour empêcher le double clic rapide
    // ... tes variables existantes ...
    const btnBack = document.getElementById("btnBack")

    // --- NOUVEAU CODE : Gestion du bouton "Valider mes sports" ---
    const sportsInputs = document.querySelectorAll('input[name="sports"]')
    const validateBtn = document.querySelector(".btn-validate")

    if (validateBtn) {
        // Fonction qui active/désactive le bouton
        function updateValidateButton() {
            // Compte combien de cases sont cochées
            const count = document.querySelectorAll(
                'input[name="sports"]:checked'
            ).length

            // Si 0 cochée, disabled = true (bouton gris). Sinon false (bouton bleu).
            validateBtn.disabled = count === 0
        }

        // On ajoute l'écouteur sur chaque checkbox
        sportsInputs.forEach((input) => {
            input.addEventListener("change", updateValidateButton)
        })

        // On lance la fonction une première fois pour désactiver le bouton au démarrage
        updateValidateButton()
    }
    // -------------------------------------------------------------
    // Initialisation
    updateProgress()
    updateUI() // Important de l'appeler au début aussi

    // Fonction pour passer à l'étape suivante (rendue globale pour le HTML)
    // Fonction pour passer à l'étape suivante (rendue globale pour le HTML)
    window.nextStep = function () {
        // --- DÉBUT AJOUT : Validation pour l'étape 3 (Sports) ---
        if (currentStep === 3) {
            // On sélectionne toutes les cases "sports" qui sont cochées
            const sportsCoques = document.querySelectorAll(
                'input[name="sports"]:checked'
            )

            // Si aucune n'est cochée, on alerte l'utilisateur et on bloque
            if (sportsCoques.length === 0) {
                alert("Veuillez sélectionner au moins un sport pour continuer.")
                return // On arrête la fonction ici, l'étape ne changera pas
            }
        }
        // --- FIN AJOUT ---

        if (currentStep < totalSteps && !isAnimating) {
            isAnimating = true // Verrouille le clic

            // Petit délai pour laisser l'animation du "clic" se faire (UX)
            setTimeout(() => {
                // Masquer l'étape actuelle
                document
                    .querySelector(`.step[data-step="${currentStep}"]`)
                    .classList.remove("active")

                // Incrémenter
                currentStep++

                // Afficher la suivante
                document
                    .querySelector(`.step[data-step="${currentStep}"]`)
                    .classList.add("active")

                updateUI()
                isAnimating = false // Déverrouille
            }, 300) // 300ms de délai
        }
    }

    // Fonction pour revenir en arrière (rendue globale)
    window.prevStep = function () {
        if (currentStep > 1 && !isAnimating) {
            document
                .querySelector(`.step[data-step="${currentStep}"]`)
                .classList.remove("active")
            currentStep--
            document
                .querySelector(`.step[data-step="${currentStep}"]`)
                .classList.add("active")
            updateUI()
        }
    }

    // Mise à jour de l'interface (Barre de progression + Bouton retour)
    function updateUI() {
        // Barre de progression
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100
        progressBar.style.width = percentage + "%"

        // Bouton retour (Caché si étape 1, sinon visible)
        if (currentStep === 1) {
            btnBack.style.visibility = "hidden"
        } else {
            btnBack.style.visibility = "visible"
        }
    }

    // Fonction de mise à jour initiale
    function updateProgress() {
        progressBar.style.width = "0%"
    }

    // Remplace ta fonction window.submitForm actuelle par celle-ci :
    window.submitForm = function () {
        const form = document.getElementById("quizForm")
        const formData = new FormData(form)
        const profilData = {}

        formData.forEach((value, key) => {
            if (profilData.hasOwnProperty(key)) {
                if (!Array.isArray(profilData[key])) {
                    profilData[key] = [profilData[key]]
                }
                profilData[key].push(value)
            } else {
                profilData[key] = value
            }
        })

        const finalStepContent = document.querySelector(".final-step-content")
        const btn = finalStepContent.querySelector(".btn-decathlon")
        const loader = document.getElementById("loader")
        const title = finalStepContent.querySelector("h2")
        const subtitle = finalStepContent.querySelector(".subtitle")
        const productsSection = document.getElementById("products-section") // Récup section produits

        finalStepContent.classList.add("is-loading")
        if (productsSection) productsSection.style.display = 'none'; // Cacher si on relance

        btn.style.display = "none"
        title.innerText = "GÉNÉRATION EN COURS..."
        subtitle.style.display = "none"
        loader.style.display = "block"

        setTimeout(async () => {
            try {
                // 1. Charger les deux fichiers JSON en parallèle
                const [exoResponse, prodResponse] = await Promise.all([
                    fetch("exo.json"),
                    fetch("produits.json")
                ]);

                if (!exoResponse.ok || !prodResponse.ok)
                    throw new Error("Erreur chargement JSON")

                const allExos = await exoResponse.json()
                const allProducts = await prodResponse.json() // Données produits

                // 2. Générer la séance
                const workout = generateWorkout(profilData, allExos)

                // 3. Afficher la séance
                displayWorkout(workout, profilData)

                // 4. Générer et afficher les produits recommandés
                displayRecommendedProducts(workout, allProducts);

            } catch (error) {
                console.error("Erreur:", error)
                finalStepContent.classList.remove("is-loading")
                title.innerText = "Oops !"
                subtitle.innerText = "Une erreur est survenue."
                subtitle.style.display = "block"
                loader.style.display = "none"
            }
        }, 1500)
    }

    /**
     * Analyse la séance, trouve le matériel manquant et affiche les produits.
     */
    function displayRecommendedProducts(workout, catalog) {
        const productsSection = document.getElementById("products-section");
        const grid = document.getElementById("products-grid");
        grid.innerHTML = ""; // Vider

        // 1. Extraire les équipements uniques nécessaires pour cette séance
        const neededEquipment = new Set();
        workout.forEach(exo => {
            if (exo.equipment) {
                exo.equipment.forEach(eq => {
                    // On normalise (minuscule) et on ignore "aucun", "mur", etc.
                    const cleanEq = eq.toLowerCase();
                    if (!['aucun', 'mur', 'mur pour support', 'chaises', 'cadre de porte'].includes(cleanEq)) {
                        neededEquipment.add(cleanEq);
                    }
                });
            }
        });

        // S'il n'y a besoin de rien (ex: full poids du corps sans tapis), on n'affiche rien
        if (neededEquipment.size === 0) return;

        // 2. Trouver les produits correspondants dans le catalogue JSON
        const suggestions = [];

        // Dictionnaire de mapping : Mot clé exercice => Type de produit dans le JSON
        // Cela permet de relier "tapis" (exo) à "Tapis de Sol" (produit)
        const mapping = {
            "tapis": "Tapis de Sol",
            "elastique": "Bandes Élastiques",
            "bande": "Bandes Élastiques",
            "haltère": "Haltères",
            "barre": "Barre et Poids",
            "bancs": "Banc de Musculation",
            "kettlebell": "Kettlebell",
            "corde": "Cardio & Abdos", // Corde à sauter
            "roues": "Cardio & Abdos", // Roue abdos
            "disques": "Accessoires Spécifiques" // Sliders
        };

        neededEquipment.forEach(eq => {
            // On cherche un mot clé correspondant
            let targetCategory = null;
            for (const [keyword, category] of Object.entries(mapping)) {
                if (eq.includes(keyword)) {
                    targetCategory = category;
                    break;
                }
            }

            if (targetCategory) {
                // On cherche dans le JSON
                const foundProducts = findProductsByCategory(catalog, targetCategory);
                // On en prend 1 ou 2 max pour ne pas spammer
                if (foundProducts.length > 0) {
                    // On évite les doublons globaux (si plusieurs exos demandent des haltères)
                    foundProducts.slice(0, 1).forEach(p => suggestions.push(p));
                }
            }
        });

        // 3. Afficher les cartes HTML
        if (suggestions.length > 0) {
            // Supprimer les doublons (au cas où)
            const uniqueSuggestions = [...new Set(suggestions.map(JSON.stringify))].map(JSON.parse);

            uniqueSuggestions.forEach(product => {
                const card = document.createElement("a");
                card.className = "product-card";
                card.href = product.url;
                card.target = "_blank"; // Ouvrir dans un nouvel onglet

                card.innerHTML = `
                <div class="product-top">
                    <div class="product-image-placeholder">
                       <svg viewBox="0 0 24 24"><path d="M22,12V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V12A1,1 0 0,1 1,11V8A2,2 0 0,1 3,6H21A2,2 0 0,1 23,8V11A1,1 0 0,1 22,12M4,8V11H20V8H4M4,13V20H20V13H4Z" /></svg>
                    </div>
                    <div class="product-title">${product.label}</div>
                </div>
                <button class="btn-shop">
                    <svg viewBox="0 0 24 24"><path d="M11,9H13V6H16V4H13V1H11V4H8V6H11M7,18A2,2 0 0,0 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20A2,2 0 0,0 7,18M17,18A2,2 0 0,0 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20A2,2 0 0,0 17,18M7.17,14.75L7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.59 17.3,11.97L21.16,4.96L19.42,4H19.41L18.31,6L15.55,11H8.53L8.4,10.73L6.16,6L5.21,4L4.27,2H1V4H3L6.6,11.59L5.25,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42C7.29,15 7.17,14.89 7.17,14.75Z" /></svg>
                    Voir
                </button>
            `;
                grid.appendChild(card);
            });

            // Afficher la section
            productsSection.style.display = "block";
        }
    }

    /**
     * Cherche récursivement dans la structure complexe de produits.json
     */
    function findProductsByCategory(catalog, categoryType) {
        let results = [];

        // Le JSON est structuré : Array -> category_group -> sub_categories -> type
        catalog.forEach(group => {
            if (group.sub_categories) {
                group.sub_categories.forEach(sub => {
                    // On cherche si le "type" (ex: "Tapis de Sol") correspond ou contient le mot clé
                    if (sub.type && (sub.type === categoryType || sub.type.includes(categoryType))) {
                        // On prend les produits de cette sous-catégorie
                        if (sub.products && sub.products.length > 0) {
                            // On prend le premier produit spécifique, pas la catégorie générale si possible
                            // Ici on prend tout pour laisser le choix, ou on filtre
                            results = results.concat(sub.products);
                        }
                    }
                    // Cas spécial pour "Cardio & Abdos" qui est un type mais contient des produits variés
                    else if (categoryType === "Cardio & Abdos" && sub.type === "Cardio & Abdos") {
                        results = results.concat(sub.products);
                    }
                });
            }
        });
        return results;
    }

    /**
     * Filtre et sélectionne les exercices en fonction du profil utilisateur.
     * @param {object} profile - Les données du formulaire de l'utilisateur.
     * @param {Array} allExos - La liste de tous les exercices disponibles.
     * @returns {Array} Une sélection d'exercices structurée.
     */
    function generateWorkout(profile, allExos) {
        const difficultyMap = {
            Debutant: ["débutant"],
            Intermediaire: ["débutant", "intermédiaire"],
            Avancé: ["intermédiaire", "avancé"],
        }
        const allowedDifficulties = difficultyMap[profile.experience] || [
            "débutant",
        ]

        const equipmentMap = {
            Aucun: ["aucun", "tapis", "mur pour support", "cadre de porte"],
            Basique: [
                "aucun",
                "tapis",
                "mur pour support",
                "cadre de porte",
                "chaises",
                "bancs",
                "box",
                "marche",
                "haltère (ou barre)",
                "bande de résistance (optionnel)",
                "cônes (optionnel)",
                "roues d'abdos",
            ],
            Complet: null,
        }
        const allowedEquipment = equipmentMap[profile.materiel]

        const objectiveMap = {
            "Perte de poids": ["cardio", "explosivité"],
            Renforcement: ["renforcement"],
            Souplesse: ["étirement", "mobilité", "souplesse", "relaxation"],
        }
        const allowedMainTypes = objectiveMap[profile.objectif] || [
            "renforcement",
        ]

        const userSports = Array.isArray(profile.sports)
            ? profile.sports
            : profile.sports
                ? [profile.sports]
                : []

        // 1. Filtrer les exercices éligibles par difficulté et matériel
        const eligibleExos = allExos.filter((exo) => {
            const difficultyMatch = allowedDifficulties.includes(exo.difficulty)
            const equipmentMatch =
                profile.materiel === "Complet" ||
                exo.equipment.every((eq) => allowedEquipment.includes(eq))
            return difficultyMatch && equipmentMatch
        })

        // 2. Créer des listes pour chaque phase de l'entraînement
        const warmupPool = eligibleExos.filter((exo) =>
            exo.type.includes("échauffement")
        )
        const mainPool = eligibleExos.filter(
            (exo) =>
                allowedMainTypes.some((type) => exo.type.includes(type)) &&
                !exo.type.includes("échauffement") &&
                !exo.type.includes("étirement") &&
                !exo.type.includes("repos")
        )
        const cooldownPool = eligibleExos.filter(
            (exo) =>
                exo.type.includes("étirement") || exo.type.includes("repos")
        )

        const sportValueMap = {
            Crossfit: ["crossfit", "plyométrie", "explosivité", "calisthenics"],
            Cyclisme: ["cyclisme"],
            Musculation: ["musculation", "force", "calisthenics"],
            SportsAquatiques: ["sports_aquatique"],
            SportsRelaxation: [
                "yoga",
                "étirement",
                "relaxation",
                "récupération",
                "souplesse",
                "pilates",
            ],
            Randonnees: ["randonnee"],
            Running: ["course à pied"],
            SportsCollectifs: ["sport", "agilité"],
            SportsRaquettes: ["sports de raquette"],
        }

        // 3. Fonction pour sélectionner les meilleurs exercices d'une liste
        const selectExos = (pool, count) => {
            if (!pool || pool.length === 0) return []

            const scored = pool
                .map((exo) => {
                    let score = 0
                    if (userSports.length > 0) {
                        userSports.forEach((sport) => {
                            const jsonSports = sportValueMap[sport] || []
                            if (
                                jsonSports.some((jsonSport) =>
                                    exo.sport_category.includes(jsonSport)
                                )
                            ) {
                                score++
                            }
                        })
                    }
                    return { ...exo, score }
                })
                .sort((a, b) => b.score - a.score)

            // On mélange les meilleurs candidats pour la variété
            let candidates = scored.slice(0, 15)
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
            }

            return candidates.slice(0, count)
        }

        // 4. Composer la séance
        const warmupExos = selectExos(warmupPool, 1)
        const mainExos = selectExos(mainPool, 3)
        const cooldownExos = selectExos(cooldownPool, 1)

        return [...warmupExos, ...mainExos, ...cooldownExos]
    }

    /**
     * Affiche la séance générée dans le DOM.
     * @param {Array} workout - La liste des exercices à afficher.
     * @param {object} profile - Le profil de l'utilisateur pour adapter les répétitions.
     */
    function displayWorkout(workout, profile) {
        const finalStepContent = document.querySelector(".final-step-content")
        const title = finalStepContent.querySelector("h2")
        const subtitle = finalStepContent.querySelector(".subtitle")
        const loader = document.getElementById("loader")
        const workoutContainer = document.getElementById("workout-container")

        finalStepContent.classList.remove("is-loading") // On retire la classe
        loader.style.display = "none"

        if (!workout || workout.length === 0) {
            title.innerText = "Désolé !"
            subtitle.innerText =
                "Aucun exercice ne correspond parfaitement à vos critères. Essayez une autre sélection."
            subtitle.style.display = "block"
            return
        }

        const repsMap = {
            Debutant: { sets: "3", reps: "10 Répétitions", time: "30 sec" },
            Intermediaire: {
                sets: "3",
                reps: "15 Répétitions",
                time: "45 sec",
            },
            Avancé: { sets: "4", reps: "20 Répétitions", time: "60 sec" },
        }
        const levelConfig = repsMap[profile.experience] || repsMap["Debutant"]

        const typeIconMap = {
            renforcement: "src/icon/muscle_V.png",
            cardio: "src/icon/coeurs_V.png",
            explosivité: "src/icon/fonctionnement_V.png", // Associé à la course/explosivité
            étirement: "src/icon/yoga_V.png",
            mobilité: "src/icon/yoga_V.png", // Même icône pour la mobilité
        }

        let warmupHtml = ""
        let mainHtml = ""
        let cooldownHtml = ""

        workout.forEach((exo) => {
            const isTimeBased =
                exo.type.includes("étirement") ||
                exo.type.includes("repos") ||
                exo.type.includes("cardio") ||
                exo.title.toLowerCase().includes("planche") ||
                exo.title.toLowerCase().includes("chaise")
            const effort = isTimeBased ? levelConfig.time : levelConfig.reps

            let iconSrc = ""
            // On cherche le premier type correspondant dans notre map pour trouver une icône
            for (const type in typeIconMap) {
                if (exo.type.includes(type)) {
                    iconSrc = typeIconMap[type]
                    break
                }
            }

            let iconHtml = "" // Par défaut, pas d'icône
            if (iconSrc) {
                // Si une icône est trouvée, on crée la balise img
                iconHtml = `<img src="${iconSrc}" class="exo-type-icon" alt="Type d'exercice">`
            }

            const cardHtml = `
                <div class="exo-card">
                    <img src="src/gif/${exo.gif}" alt="${exo.title}" class="exo-gif" loading="lazy">
                    <div class="exo-details">
                        <h3>${exo.title}</h3>
                        <div class="exo-meta">
                             ${iconHtml}
                             <p class="exo-reps">${levelConfig.sets} Séries de ${effort}</p>
                        </div>
                        <p class="exo-desc">${exo.description}</p>
                    </div>
                </div>
            `

            if (exo.type.includes("échauffement")) {
                warmupHtml += cardHtml
            } else if (
                exo.type.includes("étirement") ||
                exo.type.includes("repos")
            ) {
                cooldownHtml += cardHtml
            } else {
                mainHtml += cardHtml
            }
        })

        let finalHtml = ""
        if (warmupHtml) {
            finalHtml += `<h3 class="workout-section-title">Échauffement</h3>${warmupHtml}`
        }
        if (mainHtml) {
            finalHtml += `<h3 class="workout-section-title">Corps de séance</h3>${mainHtml}`
        }
        if (cooldownHtml) {
            finalHtml += `<h3 class="workout-section-title">Retour au calme</h3>${cooldownHtml}`
        }

        title.innerText = "Votre séance sur mesure"
        subtitle.innerText = `Voici ${workout.length} exercices conçus pour vous. Bon courage !`
        subtitle.style.display = "block"
        workoutContainer.innerHTML = finalHtml
    }
    function showStep(stepIndex) {
        // ... ton code existant qui affiche l'étape ...

        // GESTION DU BOUTON PRÉCÉDENT
        const btnBack = document.getElementById("btnBack")

        if (stepIndex === 1) {
            // Si on est à l'étape 1, on cache le bouton (ou on le rend invisible)
            btnBack.style.visibility = "hidden"
            // ou btnBack.style.display = 'none';
        } else {
            // Sinon, on l'affiche
            btnBack.style.visibility = "visible"
            // ou btnBack.style.display = 'flex';
        }
    }
})
