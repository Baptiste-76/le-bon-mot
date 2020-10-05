import wordsList from './wordsList.js';

// Les constantes
const mysteryWordDisplay = document.querySelector(".mot-depart");
const finalWordDisplay = document.querySelector(".mot-fin");
const resultDisplay = document.querySelector('.result');
const scoreDisplay = document.querySelector('.score');
const highScoreDisplay = document.querySelector('.high-score');
const timeDisplay = document.querySelector('.timer');
const endGameDisplay = document.querySelector('.end-game');
const h1AllSpan = document.querySelectorAll('h1 span:not(.exclamation-mark)');
const hr = document.querySelector('hr');

// Les variables
let startingCard;
let temporaryCard;
let allEmptyCards;
let arrayForChecking = [];
let score = 0;
let time = 60;

// On crée un interval pour le chrono
let timer = setInterval(() => {
    setTime();
}, 1000);

// On récupère et on affiche le meilleur score ou on le crée à 0 s'il n'y en a pas
if (localStorage.getItem('high-score') ===  null) {
    localStorage.setItem('high-score', 0);
}

let highScore = localStorage.getItem('high-score');
highScoreDisplay.innerText = `Meilleur Score : ${highScore}`;

// On crée une copie du tableau avec la liste des mots
let wordsListCopy = [... wordsList];

// Animation de départ
const mainTL = gsap.timeline({paused: true});
mainTL
    .from(h1AllSpan, {duration: 1, autoAlpha: 0, y: -300, stagger: 0.3, ease: "bounce.out"})
    .from(hr, {duration: 1, autoAlpha: 0, width: 0}, "<")
    .from(timeDisplay, {duration: 1, y: -100, autoAlpha: 0}, "<")
    .from(scoreDisplay, {duration: 1, x: 500, autoAlpha: 0}, "<")
    .from(highScoreDisplay, {duration: 1, x: -500, autoAlpha: 0}, "<")
    .play();

// GÉRER LE CHRONO
function setTime() {
    time--;
    timeDisplay.innerText = `Temps restant : ${time}`;

    // Si il n'y a plus de temps, c'est la fin de la partie
    if (time === 0) {
        // On arrête le chrono (pour éviter qu'il passe sous 0)
        clearInterval(timer);

        // On efface les éléments du jeu
        mysteryWordDisplay.remove();
        finalWordDisplay.remove();
        hr.remove();

        // On affiche une phrase de fin différente en fonction du score
        let paragraph = document.createElement('p');
        if (score > 30) {
            paragraph.innerText = `😍 Le jeu est terminé : IMPRESSIONNANT, vous avez fait un score de ${score} points ! Rafraîchissez la page pour recommencer une nouvelle partie. 😍`;
        } else if (score > 20 && score <= 30) {
            paragraph.innerText = `😎 Le jeu est terminé : EXCELLENT, vous avez fait un score de ${score} points ! Rafraîchissez la page pour recommencer une nouvelle partie. 😎`;
        } else if (score > 8 && score <= 20) {
            paragraph.innerText = `🙂 Le jeu est terminé : BRAVO, vous avez fait un score de ${score} points ! Rafraîchissez la page pour recommencer une nouvelle partie. 🙂`;
        } else if (score > 0 && score <= 8) {
            paragraph.innerText = `😕 Le jeu est terminé : PAS MAL, vous avez fait un score de ${score} point ! Rafraîchissez la page pour recommencer une nouvelle partie. 😕`;
        } else if (score === 0) {
            paragraph.innerText = `💩 Le jeu est terminé : AÏE, vous n'avez marqué aucun point ! Rafraîchissez la page pour recommencer une nouvelle partie. 💩`;
        }

        endGameDisplay.appendChild(paragraph);

        // On enregistre le score s'il est supérieur au meilleur score actuel
        if (score > highScore) {
            localStorage.removeItem('high-score');
            localStorage.setItem('high-score', score);

            let newHighScore = document.createElement('p');
            newHighScore.innerText = "🏁 NOUVEAU MEILLEURE SCORE 🏁";

            endGameDisplay.appendChild(newHighScore);
        }
    }
}

// COMMENCER UN NOUVEAU MOT
function startNewWorld() {
    // On remet les containers à 0
    mysteryWordDisplay.innerHTML = "";
    finalWordDisplay.innerHTML = "";

    // On fait disparaître la phrase qui dit qu'on a trouvé le mot au bout de 2 secondes
    setTimeout(() => {
        resultDisplay.innerHTML = "";
    }, 2000);

    // On obtient un nouveau mot
    let mysteryArray = getSecretWord();

    // On mélange ses morceaux
    shuffle(mysteryArray);

    mysteryArray.forEach(piece => {
        // On crée une carte pour chaque morceau du mot mystère
        let card = document.createElement('div');
        card.className = "card";
        card.setAttribute("draggable", true);
    
        let p = document.createElement('p');
        p.innerText = piece;
    
        card.appendChild(p);
        mysteryWordDisplay.appendChild(card);

        // On crée une carte vide pour chaque morceau du mot mystère
        let emptyCard = document.createElement('div');
        emptyCard.className = "empty-card";
        emptyCard.setAttribute("draggable", true);

        finalWordDisplay.appendChild(emptyCard);
    })

    // Animation des cartes
    const allCards = document.querySelectorAll('.card, .empty-card');
    const TLCards = gsap.timeline({paused: true});

    TLCards
        .from(allCards, {duration: 0.5, autoAlpha: 0, transform: "rotateY(180deg)", backfaceVisibility: "hidden", stagger: 0.1})
        .play();

    // On écoute 4 événements pour chaque carte
    allCards.forEach(card => {
        card.addEventListener('dragover', dragOver);
        card.addEventListener('dragenter', dragEnter);
        card.addEventListener('drop', drop);
        card.addEventListener('mousedown', event => {
            // Dès qu'on clique sur une carte, on met dans la variable startingCard la valeur du <p> de cette carte (cible différente selon qu'on clique sur la <div> ou le <p> directement)
            startingCard = event.target.tagName === "DIV" ? event.target.firstChild : event.target;
        });
    })

    // On isole dans une constante toutes les cases vides (= les cases de destination)
    allEmptyCards = document.querySelectorAll('.empty-card');
}

function dragOver(event) {
    event.preventDefault();
}

function dragEnter(event) {
    event.preventDefault();
}

function drop() {
    // Si la carte n'est pas vide ou null, on agit
    if (startingCard !== null) {
        if (startingCard.innerText !== "") {
            // Si la case dans laquelle on dépose la carte est vide, on lui attribue la valeur de la carte déposée et on met à vide la carte de départ
            if (this.childNodes.length === 0) {        
                let p = document.createElement("p");
                p.innerText = startingCard.innerText;
            
                startingCard.innerText = "";
            
                this.appendChild(p);
            // Sinon si la case est déjà occupée, on inverse les valeurs des deux cartes (en passant par une carte temporaire)
            } else {
                temporaryCard = document.createElement('p');
                temporaryCard.innerText = startingCard.innerText;
        
                startingCard.innerText = this.childNodes[0].innerText;
                this.childNodes[0].innerText = temporaryCard.innerText;
        
                temporaryCard.innerText = "";
            }
        }
    }

    // On vérifie la proposition
    checkCards();
}

// OBTENIR UN MOT ALÉATOIRE
function getSecretWord() {
    // On choisit un mot au hasard
    let startingWord = wordsListCopy[Math.floor(Math.random() * wordsListCopy.length)];

    // On le supprime du tableau pour qu'il ne soit pas sélectionné deux fois
    wordsListCopy = wordsListCopy.filter(element => element !== startingWord);

    // On le split en plusieurs morceaux
    let startingArray = startingWord.split("-");

    // On l'isole dans u tableau pour faire les vérifications plus tard
    arrayForChecking = [... startingArray];

    // Puis on retourne le tableau contenant les morceaux du mot mystère
    return startingArray;
}

// MÉLANGER LES MORCEAUX DU MOT MYSTÈRE
function shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;

    // Tant qu'il y a encore des éléments du tableau à traiter
    while (currentIndex !== 0) {
        // On prend un élément restant
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Et on l'échange avec l'élément actuel
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

// VERIFIER LA PROPOSITION DU JOUEUR
function checkCards() {
    let checkingArray = [];
    let choicesArray = [];
    let isComplete = false;
    let isGood = false;

    allEmptyCards.forEach(card => {
        // On vérifie pour chaque carte vide au départ s'il y a dorénavant un morceau de mot ou non 
        checkingArray.push(card.innerText !== "" ? true : false);
        // On met dans un tableau les morceaux de chaque carte 
        choicesArray.push(card.innerText);
    });

    // On passe la variable isComplete à true si chaque carte est remplie d'un morceau
    isComplete = checkingArray.every(element => element === true);

    // Si isComplete vaut true, alors on vérifie que les choix correspondent à la bonne réponse. Si oui isGood vaut true sinon il vaut false
    if (isComplete) {
        isGood = arrayForChecking.length === choicesArray.length && arrayForChecking.every((value, index) => {
            return value === choicesArray[index];
        });
    } else {
        return;
    }

    // Si isGood vaut true, on affiche un message comme quoi le mot a été trouvé
    if (isGood) {
        resultDisplay.innerText = "Bravo, vous avez trouvé le mot !";

        // On augmente le score (selon la longueur du mot) et on change son affichage
        score += choicesArray.length;
        scoreDisplay.innerText = `Score : ${score}`;

        // On tire un nouveau mot
        startNewWorld();
    }
}

// INITIALISER LE JEU
startNewWorld();