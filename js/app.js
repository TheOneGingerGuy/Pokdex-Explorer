const searchButton = document.getElementById('search-btn');
const pokemonInput = document.getElementById('poke-input');
const displayArea = document.getElementById('content');
const shinyCheckbox = document.getElementById('shiny-checkbox');

// Load any previously saved Pokemon from localStorage, or start with an empty array
const pokedex = JSON.parse(localStorage.getItem('pokedex')) || [];

// Render whatever was loaded as soon as the page starts
renderPokedex();

searchButton.addEventListener('click', () => {
  const typedName = pokemonInput.value;

  if (typedName.trim() !== '') {
    getPokemonCard(typedName);
  }
});

pokemonInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});

function getPokemonCard(pokemonName) {
  const formattedName = pokemonName.toLowerCase().trim();
  const url = `https://pokeapi.co/api/v2/pokemon/${formattedName}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        alert('Pokemon not found! Try another name.');
        throw new Error('Pokemon not found');
      }
      return response.json();
    })
    .then(data => {
      // Only keep the fields we actually use, instead of the entire API response
      const trimmedData = {
        id: data.id,
        name: data.name,
        isShiny: shinyCheckbox.checked,
        sprites: {
          front_default: data.sprites.front_default,
          front_shiny: data.sprites.front_shiny
        }
      };

      const existingIndex = pokedex.findIndex(p => p.id === trimmedData.id);

      if (existingIndex !== -1) {
        pokedex[existingIndex] = trimmedData;
      } else {
        pokedex.push(trimmedData);
      }

      savePokedex();
      renderPokedex();
      pokemonInput.value = '';
      shinyCheckbox.checked = false;
    })
    .catch(error => console.error('Error:', error));
}

function savePokedex() {
  try {
    localStorage.setItem('pokedex', JSON.stringify(pokedex));
  } catch (error) {
    console.error('Failed to save Pokedex to localStorage:', error);
    alert('Your Pokedex is getting too big to save! Some entries may not persist after reload.');
  }
}

function renderPokedex() {
  const sorted = [...pokedex].sort((a, b) => a.id - b.id);

  displayArea.innerHTML = '';

  sorted.forEach(data => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    const cardImg = document.createElement('img');

    // Use each pokemon's own saved isShiny flag, not the live checkbox
    cardImg.src = data.isShiny ? data.sprites.front_shiny : data.sprites.front_default;

    cardImg.alt = data.name;
    cardImg.style.width = "100%";
    const nameTag = document.createElement('p');
    if (data.id < 10) {
      nameTag.textContent = `00${data.id}`;
    } else if (data.id < 100 || data.id >= 1000) {
      nameTag.textContent = `0${data.id}`;
    } else {
      nameTag.textContent = `${data.id}`;
    }
    cardDiv.append(cardImg, nameTag);
    displayArea.append(cardDiv);
  });
}