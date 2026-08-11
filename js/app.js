// 1. Set up links to our HTML layout elements
const searchButton = document.getElementById('search-btn');
const pokemonInput = document.getElementById('poke-input');
const displayArea = document.getElementById('card-display-area');

// 2. Add an event click listener to the button
searchButton.addEventListener('click', () => {
  const typedName = pokemonInput.value;
  
  if (typedName.trim() !== '') {
    getPokemonCard(typedName);
  }
});

// 3. Optional: Trigger search when pressing the "Enter" key too
pokemonInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});

// 4. Core API Card Generation Function
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
      // Clear the display area so old cards disappear
      displayArea.innerHTML = '';

      // Create card wrapper layout
      const cardDiv = document.createElement('div');
      cardDiv.classList.add('card');

      // Create artwork element
      const cardImg = document.createElement('img');
      cardImg.src = data.sprites.front_default; 
      cardImg.alt = data.name;
      cardImg.style.width = "100%"; 

      // Create text label profile
      const nameTag = document.createElement('p');
      nameTag.textContent = data.id;

      // Assemble and inject
      cardDiv.append(cardImg, nameTag);
      displayArea.append(cardDiv);
      
      // Clear out the search text bar for convenience
      pokemonInput.value = '';
    })
    .catch(error => console.error('Error:', error));
}