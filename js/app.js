const searchButton = document.getElementById('search-btn');
const pokemonInput = document.getElementById('poke-input');
const displayArea = document.getElementById('content');
const shinyCheckbox = document.getElementById('shiny-checkbox');

const modal = document.getElementById('poke-modal');
const modalClose = document.getElementById('modal-close');
const modalLoading = document.getElementById('modal-loading');
const modalBody = document.getElementById('modal-body');

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

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  // Close when clicking the dark backdrop, not the card itself
  if (event.target === modal) closeModal();
});

function getPokemonCard(pokemonName) {
  const formattedName = pokemonName.toLowerCase().trim();
  const url = `https://pokeapi.co/api/v2/pokemon/${formattedName}`;

  setSearchLoading(true);

  fetch(url)
    .then(response => {
      if (!response.ok) {
        alert('Pokemon not found! Try another name.');
        throw new Error('Pokemon not found');
      }
      return response.json();
    })
    .then(data => {
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
      const wasAlreadySaved = existingIndex !== -1;

      if (wasAlreadySaved) {
        pokedex[existingIndex] = trimmedData;
      } else {
        pokedex.push(trimmedData);
      }

      savePokedex();
      renderPokedex();
      pokemonInput.value = '';
      shinyCheckbox.checked = false;

      flashCard(trimmedData.id, wasAlreadySaved ? 'updated' : 'added');
    })
    .catch(error => console.error('Error:', error))
    .finally(() => setSearchLoading(false));
}

function setSearchLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? 'Searching...' : 'Search';
}

const FLASH_CLASSES = {
  added: ['scale-110', 'ring-4', 'ring-green-400', 'shadow-lg', 'shadow-green-400/50'],
  updated: ['ring-4', 'ring-blue-400', 'shadow-lg', 'shadow-blue-400/50']
};

function flashCard(id, reason) {
  const card = displayArea.querySelector(`[data-id="${id}"]`);
  if (!card) return;

  const classes = FLASH_CLASSES[reason];
  card.classList.add(...classes);

  setTimeout(() => {
    card.classList.remove(...classes);
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
  const sorted = [...pokedex].sort((a, b) => a.id - b.id);

  displayArea.innerHTML = '';

  sorted.forEach(data => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'relative', 'transition-all', 'duration-700', 'ease-out', 'cursor-pointer');
    cardDiv.dataset.id = data.id;

    const cardImg = document.createElement('img');
    cardImg.src = data.isShiny ? data.sprites.front_shiny : data.sprites.front_default;
    cardImg.alt = data.name;
    cardImg.style.width = "100%";

    const nameTag = document.createElement('p');
    nameTag.textContent = formatPokedexNumber(data.id);

    const shinyToggle = document.createElement('button');
    shinyToggle.type = 'button';
    shinyToggle.className = 'absolute top-0.5 right-1 bg-transparent border-0 cursor-pointer text-xs leading-none p-0 disabled:cursor-not-allowed disabled:opacity-30';
    shinyToggle.textContent = data.isShiny ? '★' : '☆';
    shinyToggle.title = data.isShiny ? 'Showing shiny — click for normal' : 'Showing normal — click for shiny';
    shinyToggle.disabled = !data.sprites.front_shiny;

    shinyToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const target = pokedex.find(p => p.id === data.id);
      if (!target) return;
      target.isShiny = !target.isShiny;
      savePokedex();
      renderPokedex();
    });

    // Click anywhere else on the card opens the detail popup
    cardDiv.addEventListener('click', () => openPokemonModal(data));

    cardDiv.append(cardImg, nameTag, shinyToggle);
    displayArea.append(cardDiv);
  });
}

function openPokemonModal(data) {
  modal.classList.remove('hidden');
  modalBody.classList.add('hidden');
  modalLoading.classList.remove('hidden');

  fetch(`https://pokeapi.co/api/v2/pokemon/${data.id}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load details');
      return response.json();
    })
    .then(details => {
      document.getElementById('modal-number').textContent = `#${formatPokedexNumber(details.id)}`;
      document.getElementById('modal-name').textContent = details.name;
      document.getElementById('modal-sprite').src = data.isShiny
        ? details.sprites.front_shiny
        : details.sprites.front_default;

      const typesEl = document.getElementById('modal-types');
      typesEl.innerHTML = '';
      details.types.forEach(t => {
        const badge = document.createElement('span');
        badge.textContent = t.type.name;
        badge.className = 'px-2 py-0.5 rounded-full text-xs capitalize bg-cyan-200 border border-cyan-400';
        typesEl.append(badge);
      });

      document.getElementById('modal-height').textContent = `${details.height / 10} m`;
      document.getElementById('modal-weight').textContent = `${details.weight / 10} kg`;

      const abilitiesEl = document.getElementById('modal-abilities');
      abilitiesEl.innerHTML = '';
      details.abilities.forEach(a => {
        const li = document.createElement('li');
        li.textContent = a.ability.name.replace('-', ' ');
        li.className = 'capitalize';
        abilitiesEl.append(li);
      });

      const statsEl = document.getElementById('modal-stats');
      statsEl.innerHTML = '';
      details.stats.forEach(s => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2 text-xs';
        li.innerHTML = `
          <span class="w-20 capitalize shrink-0">${s.stat.name.replace('-', ' ')}</span>
          <span class="w-8 text-right shrink-0">${s.base_stat}</span>
          <span class="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
            <span class="block h-full bg-cyan-400" style="width:${Math.min(100, s.base_stat / 1.5)}%"></span>
          </span>
        `;
        statsEl.append(li);
      });

      modalLoading.classList.add('hidden');
      modalBody.classList.remove('hidden');
    })
    .catch(error => {
      console.error('Error loading Pokemon details:', error);
      closeModal();
      alert('Could not load Pokemon details.');
    });
}

function closeModal() {
  modal.classList.add('hidden');
}