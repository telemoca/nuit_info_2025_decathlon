// On attend que le DOM soit chargé pour éviter les erreurs "null"
document.addEventListener("DOMContentLoaded", () => {
    // Variables de gestion d'état
    let currentStep = 1
    const totalSteps = 6
    const progressBar = document.getElementById("progressBar")
    let isAnimating = false // Sécurité pour empêcher le double clic rapide
    const btnBack = document.getElementById("btnBack")
    let scrollIndicator = null // Déclarer ici, initialiser plus bas
    let validateBtnVisible = false // Nouvel état pour la visibilité du bouton

    // --- Gestion du bouton "Valider mes sports" ---
    const sportsInputs = document.querySelectorAll('input[name="sports"]')
    const validateBtn = document.querySelector(".btn-validate")

    if (validateBtn) {
        // Fonction qui active/désactive le bouton
        function updateValidateButton() {
            const count = document.querySelectorAll(
                'input[name="sports"]:checked'
            ).length

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

    // Initialisation du scroll indicator et du gestionnaire de scroll
    scrollIndicator = document.getElementById("scrollIndicator")
    const mainScrollContainer = document.documentElement // Utilise document.documentElement pour le scroll de la page entière

    // Nouvelle approche : observer la visibilité du bouton avec IntersectionObserver
    let observer = null
    function setupValidateBtnObserver() {
        if (!validateBtn) return
        if (observer) observer.disconnect()

        observer = new IntersectionObserver(
            (entries) => {
                validateBtnVisible = entries[0].isIntersecting
                updateScrollIndicator()
            },
            {
                root: null, // viewport
                threshold: 0, // dès qu'une partie du bouton est visible
            }
        )
        observer.observe(validateBtn)
    }
    setupValidateBtnObserver()

    // Fonction pour afficher ou cacher la flèche selon la visibilité du bouton et le scroll
    function updateScrollIndicator() {
        if (currentStep === 3 && scrollIndicator) {
            // La page est considérée en fin de défilement si le bas du contenu est très proche du bas du viewport
            const hasReachedEndOfContent =
                mainScrollContainer.scrollHeight -
                    mainScrollContainer.scrollTop <=
                mainScrollContainer.clientHeight + 5

            // La flèche est active si le bouton n'est PAS visible ET qu'on n'est PAS en bas
            if (!validateBtnVisible && !hasReachedEndOfContent) {
                scrollIndicator.classList.add("active")
            } else {
                scrollIndicator.classList.remove("active")
            }
        } else if (scrollIndicator) {
            scrollIndicator.classList.remove("active")
        }
    }

    // Sur chaque scroll, on met à jour l'indicateur
    mainScrollContainer.addEventListener("scroll", updateScrollIndicator)

    // Initialisation
    updateProgress()
    updateUI() // Important de l'appeler au début aussi

    // Fonction pour passer à l'étape suivante (rendue globale pour le HTML)
    window.nextStep = function () {
        // Validation étape 3 (Sports) - On garde ton code existant
        if (currentStep === 3) {
            const sportsCoques = document.querySelectorAll(
                'input[name="sports"]:checked'
            )
            if (sportsCoques.length === 0) {
                alert("Veuillez sélectionner au moins un sport pour continuer.")
                return
            }
        }

        if (currentStep < totalSteps && !isAnimating) {
            isAnimating = true

            setTimeout(() => {
                document
                    .querySelector(`.step[data-step="${currentStep}"]`)
                    .classList.remove("active")
                currentStep++
                document
                    .querySelector(`.step[data-step="${currentStep}"]`)
                    .classList.add("active")

                // --- AJOUT ICI : Réinitialiser l'étape finale si on y arrive ---
                if (currentStep === totalSteps) {
                    resetFinalStepUI()
                }
                // -------------------------------------------------------------

                updateUI()
                isAnimating = false
                if (currentStep === 3) setupValidateBtnObserver()
            }, 300)
        }
    }

    // Fonction pour revenir en arrière (rendue globale)
    // --- 1. MODIFIER LA FONCTION DE RETOUR (window.prevStep) ---
    window.prevStep = function () {
        // Cas spécial : Si on est à l'étape 1, on retourne à l'accueil
        if (currentStep === 1) {
            window.location.href = "welcome.html"
            return
        }

        // Sinon, comportement normal (étape précédente du formulaire)
        if (currentStep > 1 && !isAnimating) {
            document
                .querySelector(`.step[data-step="${currentStep}"]`)
                .classList.remove("active")
            currentStep--
            document
                .querySelector(`.step[data-step="${currentStep}"]`)
                .classList.add("active")
            updateUI()

            if (currentStep === 3) setupValidateBtnObserver()
        }
    }

    // --- 2. MODIFIER LA MISE À JOUR DE L'INTERFACE (updateUI) ---
    function updateUI() {
        // Barre de progression
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100
        progressBar.style.width = percentage + "%"

        // Bouton retour :
        // AVANT : Il était caché à l'étape 1.
        // MAINTENANT : Il est toujours visible.
        if (btnBack) {
            btnBack.style.visibility = "visible"

            // Optionnel : Changer le texte pour être plus précis sur l'étape 1
            // Tu peux supprimer ce bloc si tu veux garder juste "Précédent"
            const btnText = btnBack.lastChild // Le noeud texte après le SVG
            if (currentStep === 1) {
                // Sur l'étape 1, on peut suggérer "Accueil" ou garder "Précédent"
                if (btnText.nodeType === 3) btnText.textContent = " Accueil"
            } else {
                if (btnText.nodeType === 3) btnText.textContent = " Précédent"
            }
        }

        // Gérer l'indicateur de défilement pour l'étape 3
        updateScrollIndicator()
    }

    // Fonction de mise à jour initiale
    function updateProgress() {
        progressBar.style.width = "0%"
    }

    // On stocke le catalogue produits pour la modale
    let globalProductsCatalog = null

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
        if (productsSection) productsSection.style.display = "none" // Cacher si on relance

        btn.style.display = "none"
        title.innerText = "GÉNÉRATION EN COURS..."
        subtitle.style.display = "none"
        loader.style.display = "block"

        setTimeout(async () => {
            try {
                // 1. Charger les deux fichiers JSON en parallèle
                const [exoResponse, prodResponse] = await Promise.all([
                    fetch("exo.json"),
                    fetch("produits.json"),
                ])

                if (!exoResponse.ok || !prodResponse.ok)
                    throw new Error("Erreur chargement JSON")

                const allExos = await exoResponse.json()
                const allProducts = await prodResponse.json() // Données produits
                globalProductsCatalog = allProducts // Stocke pour la modale

                // 2. Générer la séance
                const workout = generateWorkout(profilData, allExos)

                // 3. Pour chaque exo, ajoute les produits utiles
                workout.forEach((exo) => {
                    exo.recommended_products = getProductsForExercise(
                        exo,
                        allProducts
                    )
                })

                // 4. Afficher la séance
                displayWorkout(workout, profilData)

                // 5. Générer et afficher les produits recommandés
                displayRecommendedProducts(workout, allProducts)
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
        const productsSection = document.getElementById("products-section")
        const grid = document.getElementById("products-grid")
        grid.innerHTML = "" // Vider

        // Correction : s'assurer que catalog est bien un tableau
        let catalogArray = catalog
        if (!Array.isArray(catalogArray)) {
            // Essaye de trouver la clé qui contient le tableau (ex: "products" ou "data")
            if (Array.isArray(catalog.products)) {
                catalogArray = catalog.products
            } else if (Array.isArray(catalog.data)) {
                catalogArray = catalog.data
            } else {
                // Si rien ne correspond, on ne fait rien
                return
            }
        }

        // 1. Extraire les équipements uniques nécessaires pour cette séance
        const neededEquipment = new Set()
        workout.forEach((exo) => {
            if (exo.equipment) {
                exo.equipment.forEach((eq) => {
                    // On normalise (minuscule) et on ignore "aucun", "mur", etc.
                    const cleanEq = eq.toLowerCase()
                    if (
                        ![
                            "aucun",
                            "mur",
                            "mur pour support",
                            "chaises",
                            "cadre de porte",
                        ].includes(cleanEq)
                    ) {
                        neededEquipment.add(cleanEq)
                    }
                })
            }
        })

        // S'il n'y a besoin de rien (ex: full poids du corps sans tapis), on n'affiche rien
        if (neededEquipment.size === 0) return

        // 2. Trouver les produits correspondants dans le catalogue JSON
        const suggestions = []

        // Dictionnaire de mapping : Mot clé exercice => Type de produit dans le JSON
        // Cela permet de relier "tapis" (exo) à "Tapis de Sol" (produit)
        const mapping = {
            tapis: "Tapis de Sol",
            elastique: "Bandes Élastiques",
            bande: "Bandes Élastiques",
            haltère: "Haltères",
            barre: "Barre et Poids",
            bancs: "Banc de Musculation",
            kettlebell: "Kettlebell",
            corde: "Cardio & Abdos", // Corde à sauter
            roues: "Cardio & Abdos", // Roue abdos
            disques: "Accessoires Spécifiques", // Sliders
        }

        neededEquipment.forEach((eq) => {
            // On cherche un mot clé correspondant
            let targetCategory = null
            for (const [keyword, category] of Object.entries(mapping)) {
                if (eq.includes(keyword)) {
                    targetCategory = category
                    break
                }
            }

            if (targetCategory) {
                // Correction ici : passer catalogArray au lieu de catalog
                const foundProducts = findProductsByCategory(
                    catalogArray,
                    targetCategory
                )
                // On en prend 1 ou 2 max pour ne pas spammer
                if (foundProducts.length > 0) {
                    // On évite les doublons globaux (si plusieurs exos demandent des haltères)
                    foundProducts
                        .slice(0, 1)
                        .forEach((p) => suggestions.push(p))
                }
            }
        })

        // 3. Afficher les cartes HTML
        if (suggestions.length > 0) {
            // Supprimer les doublons (au cas où)
            const uniqueSuggestions = [
                ...new Set(suggestions.map(JSON.stringify)),
            ].map(JSON.parse)

            uniqueSuggestions.forEach((product) => {
                const card = document.createElement("a")
                card.className = "product-card"
                card.href = product.url
                card.target = "_blank" // Ouvrir dans un nouvel onglet

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
            `
                grid.appendChild(card)
            })

            // Afficher la section
            productsSection.style.display = "block"
        }
    }

    /**
     * Affiche les équipements recommandés pour la séance complète
     */
    function displayWorkoutEquipmentSection(workout, allExos) {
        const workoutContainer = document.getElementById("workout-container")

        // Collecter tous les équipements uniques de la séance
        const allEquipment = new Set()
        const equipmentToProducts = {}

        workout.forEach((exo) => {
            if (exo.equipment && Array.isArray(exo.equipment)) {
                exo.equipment.forEach((eq) => {
                    const cleanEq = eq.toLowerCase()
                    if (
                        ![
                            "aucun",
                            "mur",
                            "mur pour support",
                            "cadre de porte",
                            "sol",
                        ].includes(cleanEq)
                    ) {
                        allEquipment.add(cleanEq)
                        if (!equipmentToProducts[cleanEq]) {
                            equipmentToProducts[cleanEq] = []
                        }
                    }
                })
            }
        })

        if (allEquipment.size === 0) return

        // Mapping des équipements aux catégories de produits
        const equipmentCategoryMapping = {
            tapis: "Tapis de Sol",
            élastique: "Bandes Élastiques",
            bande: "Bandes Élastiques",
            haltère: "Haltères",
            "haltère (ou barre)": "Haltères",
            barre: "Barre et Poids",
            disques: "Barre et Poids",
            bancs: "Banc de Musculation",
            chaises: "Banc de Musculation",
            kettlebell: "Kettlebell",
            corde: "Cordes à Sauter",
            "roues d'abdos": "Cardio & Abdos",
            box: "Plyométrie & Agilité",
            marche: "Plyométrie & Agilité",
            cônes: "Plyométrie & Agilité",
            "bande de résistance": "Bandes Élastiques",
        }

        // Trouver les produits correspondants
        const suggestedProducts = new Map()
        const bonusProducts = []

        allEquipment.forEach((eq) => {
            const categoryKey = Object.keys(equipmentCategoryMapping).find(
                (key) => eq.includes(key)
            )
            if (categoryKey) {
                const categoryName = equipmentCategoryMapping[categoryKey]
                const foundProducts = findProductsByCategory(
                    globalProductsCatalog.categories,
                    categoryName
                )

                foundProducts.slice(0, 1).forEach((prod) => {
                    if (!suggestedProducts.has(prod.id)) {
                        suggestedProducts.set(prod.id, prod)
                    }
                })
            }
        })

        // Ajouter quelques produits bonus optionnels (pas strictement nécessaires mais utiles)
        const bonusCategories = [
            "Sangles de Yoga",
            "Briques de Yoga",
            "Swiss Balls (Gym Ball)",
            "Accessoires de Glisse",
        ]
        bonusCategories.forEach((cat) => {
            const bonusProds = findProductsByCategory(
                globalProductsCatalog.categories,
                cat
            )
            if (
                bonusProds.length > 0 &&
                !suggestedProducts.has(bonusProds[0].id)
            ) {
                bonusProducts.push(bonusProds[0])
            }
        })

        // Générer le HTML
        if (suggestedProducts.size > 0 || bonusProducts.length > 0) {
            let equipmentHTML = `<h3 class="workout-section-title">Équipements pour cette séance</h3>`
            equipmentHTML += `<p class="subtitle" style="margin-bottom: 20px;">Voici le matériel recommandé pour réaliser tous les exercices.</p>`
            equipmentHTML += `<div class="workout-equipment-grid">`

            // Produits recommandés (essentiels)
            suggestedProducts.forEach((prod) => {
                equipmentHTML += createEquipmentCard(prod, true)
            })

            // Produits bonus (optionnels)
            if (bonusProducts.length > 0) {
                equipmentHTML += `<div class="equipment-divider"></div>`
                equipmentHTML += `<div class="equipment-bonus-label">Bonus optionnel</div>`
                bonusProducts.forEach((prod) => {
                    equipmentHTML += createEquipmentCard(prod, false)
                })
            }

            equipmentHTML += `</div>`
            workoutContainer.insertAdjacentHTML("beforeend", equipmentHTML)
        }
    }

    /**
     * Crée une carte produit pour la section équipements
     */
    function createEquipmentCard(prod, isEssential) {
        return `
            <a href="${prod.url}" class="equipment-card ${
            isEssential ? "essential" : "bonus"
        }" target="_blank" rel="noopener">
                <div class="equipment-card-img">
                    ${
                        prod.image_path
                            ? `<img src="${prod.image_path}" alt="${prod.nom}">`
                            : `<svg viewBox="0 0 24 24" width="60" height="60"><circle cx="12" cy="12" r="10" fill="#e3e8ef"/></svg>`
                    }
                </div>
                <div class="equipment-card-info">
                    <p class="equipment-card-name">${prod.nom}</p>
                    <p class="equipment-card-price">${
                        prod.prix
                            ? prod.prix.valeur + " " + prod.prix.devise
                            : ""
                    }</p>
                    ${
                        !isEssential
                            ? '<span class="equipment-bonus-tag">Optionnel</span>'
                            : ""
                    }
                </div>
            </a>
        `
    }

    /**
     * Enveloppe pour findProductsByCategory si besoin
     */
    function findProductsByCategory(categoriesArray, categoryType) {
        let results = []
        if (!Array.isArray(categoriesArray)) return results

        categoriesArray.forEach((group) => {
            if (group.produits && Array.isArray(group.produits)) {
                group.produits.forEach((prod) => {
                    // Cherche si le produit correspond (par nom ou tags)
                    const prodName = (prod.nom || "").toLowerCase()
                    if (prodName.includes(categoryType.toLowerCase())) {
                        results.push(prod)
                    }
                })
            }
        })
        return results
    }
})
