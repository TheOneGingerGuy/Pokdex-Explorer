const searchButton = document.getElementById('search-btn');
const pokemonInput = document.getElementById('poke-input');
const displayArea = document.getElementById('content');
const typeFilter = document.getElementById('type-filter');
const favoriteFilter = document.getElementById('favorite-filter');
const scrollTopBtn = document.getElementById('scroll-top-btn');

const modal = document.getElementById('poke-modal');
const modalClose = document.getElementById('modal-close');
const modalLoading = document.getElementById('modal-loading');
const modalBody = document.getElementById('modal-body');

let pokedex = JSON.parse(localStorage.getItem('pokedex')) || [];
let activeTypeFilter = 'all';
let showFavoritesOnly = false;

startApp();

searchButton.addEventListener('click', () => {
  const typedName = pokemonInput.value;
  if (typedName.trim() !== '') {
    searchForPokemon(typedName);
  }
});

pokemonInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});

typeFilter.addEventListener('change', () => {
  activeTypeFilter = typeFilter.value;
  renderPokedex();
});

favoriteFilter.addEventListener('change', () => {
  showFavoritesOnly = favoriteFilter.checked;
  renderPokedex();
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

displayArea.addEventListener('scroll', () => {
  if (displayArea.scrollTop > 300) {
    scrollTopBtn.classList.remove('hidden');
  } else {
    scrollTopBtn.classList.add('hidden');
  }
});

scrollTopBtn.addEventListener('click', () => {
  displayArea.scrollTo({ top: 0, behavior: 'smooth' });
});

async function startApp() {
  if (pokedex.length === 0) {
    await loadFirst151();
  } else {
    await addMissingTypes();
  }
  renderPokedex();
}

async function loadFirst151() {
  displayArea.innerHTML = '<p class="loading-message">Loading the original 151...</p>';

  for (let id = 1; id <= 151; id++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await response.json();
      pokedex.push(pokemonDataToCard(data));
    } catch (error) {
      console.error(`Could not load pokemon #${id}`, error);
    }
  }

  savePokedex();
}

async function addMissingTypes() {
  for (const pokemon of pokedex) {
    if (!pokemon.types) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
        const data = await response.json();
        pokemon.types = data.types.map(t => t.type.name);
      } catch (error) {
        console.error(`Could not update types for ${pokemon.name}`, error);
      }
    }
  }

  savePokedex();
}

function pokemonDataToCard(data) {
  return {
    id: data.id,
    name: data.name,
    isShiny: false,
    isFavorite: false,
    types: data.types.map(t => t.type.name),
    sprites: {
      front_default: data.sprites.front_default,
      front_shiny: data.sprites.front_shiny
    }
  };
}

async function searchForPokemon(pokemonName) {
  const formattedName = pokemonName.toLowerCase().trim();

  searchButton.disabled = true;
  searchButton.textContent = 'Searching...';

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`);

    if (!response.ok) {
      alert('Pokemon not found! Try another name.');
      return;
    }

    const data = await response.json();
    const newCard = pokemonDataToCard(data);

    const existingIndex = pokedex.findIndex(p => p.id === newCard.id);
    const alreadySaved = existingIndex !== -1;

    if (alreadySaved) {
      newCard.isFavorite = pokedex[existingIndex].isFavorite;
      pokedex[existingIndex] = newCard;
    } else {
      pokedex.push(newCard);
    }

    savePokedex();
    renderPokedex();
    pokemonInput.value = '';
    flashCard(newCard.id, alreadySaved ? 'flash-updated' : 'flash-added');

  } catch (error) {
    console.error('Something went wrong searching for a pokemon:', error);
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = 'Search';
  }
}

function flashCard(id, className) {
  const card = displayArea.querySelector(`[data-id="${id}"]`);
  if (!card) return;

  card.classList.add(className);
  setTimeout(() => {
    card.classList.remove(className);
  }, 900);
}

function savePokedex() {
  try {
    localStorage.setItem('pokedex', JSON.stringify(pokedex));
  } catch (error) {
    console.error('Failed to save Pokedex to localStorage:', error);
    alert('Your Pokedex is getting too big to save! Some entries may not persist after reload.');
  }
}

function formatPokedexNumber(id) {
  if (id < 10) return `00${id}`;
  if (id < 100) return `0${id}`;
  return `${id}`;
}

function renderPokedex() {
  let pokemonToShow = pokedex;

  if (activeTypeFilter !== 'all') {
    pokemonToShow = pokemonToShow.filter(p => p.types && p.types.includes(activeTypeFilter));
  }

  if (showFavoritesOnly) {
    pokemonToShow = pokemonToShow.filter(p => p.isFavorite);
  }

  pokemonToShow.sort((a, b) => a.id - b.id);

  displayArea.innerHTML = '';

  if (pokemonToShow.length === 0) {
    displayArea.innerHTML = '<p class="empty-message">No pokemon match this filter.</p>';
    return;
  }

  for (const pokemon of pokemonToShow) {
    const card = buildPokemonCard(pokemon);
    displayArea.append(card);
  }
}

function buildPokemonCard(pokemon) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = pokemon.id;

  const image = document.createElement('img');
  image.src = pokemon.isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default;
  image.alt = pokemon.name;
  image.style.width = '100%';

  const numberLabel = document.createElement('p');
  numberLabel.textContent = formatPokedexNumber(pokemon.id);

  const shinyButton = document.createElement('button');
  shinyButton.type = 'button';
  shinyButton.className = 'shiny-toggle';
  shinyButton.textContent = pokemon.isShiny ? '★' : '☆';
  shinyButton.disabled = !pokemon.sprites.front_shiny;

  shinyButton.addEventListener('click', (event) => {
    event.stopPropagation();
    pokemon.isShiny = !pokemon.isShiny;
    savePokedex();
    renderPokedex();
  });

  const heartButton = document.createElement('button');
  heartButton.type = 'button';
  heartButton.className = 'heart-toggle';
  if (pokemon.isFavorite) {
    heartButton.classList.add('is-favorite');
  }
  heartButton.textContent = '♥';

  heartButton.addEventListener('click', (event) => {
    event.stopPropagation();
    pokemon.isFavorite = !pokemon.isFavorite;
    savePokedex();
    renderPokedex();
  });

  card.addEventListener('click', () => {
    card.classList.add('card-flip');
    setTimeout(() => {
      card.classList.remove('card-flip');
      showPokemonModal(pokemon);
    }, 500);
  });

  card.append(image, numberLabel, shinyButton, heartButton);
  return card;
}

async function showPokemonModal(pokemon) {
  modal.classList.remove('hidden');
  modalBody.classList.add('hidden');
  modalLoading.classList.remove('hidden');

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
    const details = await response.json();

    document.getElementById('modal-number').textContent = `#${formatPokedexNumber(details.id)}`;
    document.getElementById('modal-name').textContent = details.name;
    document.getElementById('modal-sprite').src = pokemon.isShiny
      ? details.sprites.front_shiny
      : details.sprites.front_default;

    const typesEl = document.getElementById('modal-types');
    typesEl.innerHTML = '';
    for (const t of details.types) {
      const badge = document.createElement('span');
      badge.textContent = t.type.name;
      badge.className = 'type-badge';
      typesEl.append(badge);
    }

    document.getElementById('modal-height').textContent = `${details.height / 10} m`;
    document.getElementById('modal-weight').textContent = `${details.weight / 10} kg`;

    const abilitiesEl = document.getElementById('modal-abilities');
    abilitiesEl.innerHTML = '';
    for (const a of details.abilities) {
      const item = document.createElement('li');
      item.textContent = a.ability.name.replace('-', ' ');
      abilitiesEl.append(item);
    }

    const statsEl = document.getElementById('modal-stats');
    statsEl.innerHTML = '';
    for (const s of details.stats) {
      const item = document.createElement('li');
      item.className = 'stat-row';
      item.innerHTML = `
        <span class="stat-label">${s.stat.name.replace('-', ' ')}</span>
        <span class="stat-value">${s.base_stat}</span>
        <span class="stat-bar-track">
          <span class="stat-bar-fill" style="width:${Math.min(100, s.base_stat / 1.5)}%"></span>
        </span>
      `;
      statsEl.append(item);
    }

    modalLoading.classList.add('hidden');
    modalBody.classList.remove('hidden');

  } catch (error) {
    console.error('Error loading pokemon details:', error);
    closeModal();
    alert('Could not load Pokemon details.');
  }
}

function closeModal() {
  modal.classList.add('hidden');
}