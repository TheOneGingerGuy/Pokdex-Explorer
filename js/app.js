const searchButton = document.getElementById('search-btn');
const pokemonInput = document.getElementById('poke-input');
const displayArea = document.getElementById('content');

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
  const cardDiv = document.createElement('div');

  cardDiv.classList.add('card');

  const cardImg = document.createElement('img');

  cardImg.src = data.sprites.front_default; 

  cardImg.alt = data.name;

  cardImg.style.width = "100%"; 

  const nameTag = document.createElement('p');
  if (data.id < 10){
    nameTag.textContent = `00${data.id}`;
  } else if (data.id < 100 || data.id >= 1000){
    nameTag.textContent = `0${data.id}`;
  } else {
    nameTag.textContent = `${data.id}`;
  }
  cardDiv.append(cardImg, nameTag);
  displayArea.append(cardDiv);
  pokemonInput.value = '';
})
    .catch(error => console.error('Error:', error));
}