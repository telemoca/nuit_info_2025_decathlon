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

    // Fonction finale de soumission (rendue globale)
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

        finalStepContent.classList.add("is-loading")

        btn.style.display = "none"
        title.innerText = "GÉNÉRATION EN COURS..."
        subtitle.style.display = "none"
        loader.style.display = "block"

        setTimeout(async () => {
            try {
                const response = await fetch("exo.json")
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`)
                const allExos = await response.json()

                const workout = generateWorkout(profilData, allExos)
                displayWorkout(workout, profilData)
            } catch (error) {
                console.error(
                    "Erreur lors de la génération de la séance:",
                    error
                )
                finalStepContent.classList.remove("is-loading") // On retire la classe en cas d'erreur
                title.innerText = "Oops !"
                subtitle.innerText =
                    "Nous n'avons pas pu générer votre séance. Veuillez réessayer."
                subtitle.style.display = "block"
                loader.style.display = "none"
            }
        }, 1500)
    }

    /**
     * Filtre et sélectionne les exercices en fonction du profil utilisateur.
     * @param {object} profile - Les données du formulaire de l'utilisateur.
     * @param {Array} allExos - La liste de tous les exercices disponibles.
     * @returns {Array} Une sélection de 5 exercices.
     */
    function generateWorkout(profile, allExos) {
        const difficultyMap = {
            Debutant: ["debutant"],
            Intermediaire: ["debutant", "intermediaire"],
            Avancé: ["intermediaire", "avance", "expert"],
        }
        const allowedDifficulties = difficultyMap[profile.experience] || [
            "debutant",
        ]

        const equipmentMap = {
            Aucun: [
                "poids_du_corps",
                "tapis",
                "aucun",
                "mur",
                "chaise",
                "marche_escalier",
                "table_solide",
            ],
            Basique: [
                "poids_du_corps",
                "tapis",
                "aucun",
                "mur",
                "chaise",
                "marche_escalier",
                "table_solide",
                "elastique",
                "kettlebell",
                "halteres",
                "banc",
                "banc_solide",
                "box",
            ],
            Complet: null,
        }
        const allowedEquipment = equipmentMap[profile.materiel]

        const objectiveMap = {
            "Perte de poids": ["cardio", "cardio_renforcement"],
            Renforcement: ["renforcement"],
            Souplesse: ["etirement", "relaxation"],
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
        const warmupPool = eligibleExos.filter(
            (exo) => exo.type === "echauffement"
        )
        const mainPool = eligibleExos.filter((exo) =>
            allowedMainTypes.includes(exo.type)
        )
        const cooldownPool = eligibleExos.filter((exo) =>
            ["etirement", "relaxation"].includes(exo.type)
        )

        const sportValueMap = {
            Crossfit: "crossfit",
            Cyclisme: "cyclisme",
            Musculation: "musculation",
            SportsAquatiques: "sports_aquatique",
            SportsRelaxation: "sport_relaxation",
            Randonnees: "randonnee",
            Running: "running",
            SportsCollectifs: "sport_collectif",
            SportsRaquettes: "sports_raquete",
        }

        // 3. Fonction pour sélectionner les meilleurs exercices d'une liste
        const selectExos = (pool, count) => {
            if (!pool || pool.length === 0) return []

            const scored = pool
                .map((exo) => {
                    let score = 0
                    if (userSports.length > 0) {
                        userSports.forEach((sport) => {
                            const jsonSport = sportValueMap[sport]
                            if (
                                jsonSport &&
                                exo.sport_category.includes(jsonSport)
                            )
                                score++
                        })
                    }
                    if (exo.sport_category.includes("tous")) score += 0.5
                    return { ...exo, score }
                })
                .sort((a, b) => b.score - a.score)

            // On mélange les meilleurs candidats pour la variété
            let candidates = scored.slice(0, 10)
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
            cardio_renforcement: "src/icon/fonctionnement_V.png",
            etirement: "src/icon/yoga_V.png",
            relaxation: "src/icon/lotus_V.png",
            echauffement: "src/icon/debut_V.png",
        }

        let warmupHtml = ""
        let mainHtml = ""
        let cooldownHtml = ""

        workout.forEach((exo) => {
            const isTimeBased =
                ["etirement", "relaxation", "cardio"].includes(exo.type) ||
                exo.title.toLowerCase().includes("planche") ||
                exo.title.toLowerCase().includes("chaise")
            const effort = isTimeBased ? levelConfig.time : levelConfig.reps
            const iconSrc = typeIconMap[exo.type] || "src/icon/kettlebell_V.png" // Icône par défaut

            const cardHtml = `
                <div class="exo-card">
                    <img src="src/gif/${exo.gif}" alt="${exo.title}" class="exo-gif" loading="lazy">
                    <div class="exo-details">
                        <h3>${exo.title}</h3>
                        <div class="exo-meta">
                             <img src="${iconSrc}" class="exo-type-icon" alt="Type d'exercice">
                             <p class="exo-reps">${levelConfig.sets} Séries de ${effort}</p>
                        </div>
                        <p class="exo-desc">${exo.description}</p>
                    </div>
                </div>
            `

            if (exo.type === "echauffement") {
                warmupHtml += cardHtml
            } else if (["etirement", "relaxation"].includes(exo.type)) {
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
