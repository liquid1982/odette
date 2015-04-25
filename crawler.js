/**
 * Esempio di crawler per salvare l'elenco dei teatri da Milanodabere.
 * ---
 * Prima di eseguire questo file, è necessario lanciare il comando
 *
 *   npm install
 *
 * che serve ad installare le dipendenze necessarie.
 *
 * Successivamente, basterà eseguire
 *
 *   node crawler.js
 *
 * per salvare sul file `venues.json` la lista dei teatri.
 */

// request è una libreria che ci permette di fare chiamate HTTP.
var request = require('request');

// cheerio serve per estrarre informazioni da un documento HTML.
// È molto simile a jQuery e ci permette di selezionare nodi HTML
// utilizzando dei selettori CSS.
var cheerio = require('cheerio');

// async è una libreria che ci permette di gestire le callback.
// Più avanti nel file vedremo di cosa si tratta.
var async = require('async');

// fs è una libreria per leggere e scrivere files. Ci servirà per
// salvare il file JSON contenente l'elenco dei teatri.
var fs = require('fs');

// Per prima cosa definisco una URL di base...
var baseUrl = 'http://www.milanodabere.it';

// ...ed un elenco di pagine in cui mi aspetto di trovare le informazioni.
var paths = [
  '/milano/teatri',
  '/milano/teatri/2',
  '/milano/teatri/3',
  '/milano/teatri/4',
  '/milano/teatri/5'
];

// Qui definisco una funzione da eseguire per ciascuna delle pagine che
// visiterà il crawler. Come argomento passeremo un path.

var fetchVenues = function(path, callback) {

  // La funzione request accetta come primo argomento un indirizzo web completo
  // (es. http://www.milanodabere.it/milano/teatri), e come secondo argomento
  // una funzione di callback che sarà eseguita nel momento in cui il server
  // avrà risposto con un documento HTML.
  // Questa funzione di callback, a sua volta, sarà invocata con tre parametri.
  // Il primo, `error`, conterrà undefined se tutto è andato per il verso giusto,
  // altrimenti conterrà un oggetto che descriverà l'errore.
  // Il secondo, `response`, conterrà un oggetto che descrive la risposta HTTP che ci è
  // stata inviata dal server.
  // Il terzo, `body`, conterrà l'HTML della pagina dal quale dovremo estrarre le
  // informazioni che cerchiamo.

  request(baseUrl + path, function(error, response, body) {
    // Definisco un array vuoto all'interno del quale memorizzerò tutti i teatri
    // che ho trovato nella pagina corrente.

    var venues = [];

    // Salvo, all'interno di `elements`, tutti gli elementi HTML che contengono
    // le informazioni sui teatri. Per individuarli, uso un selettore CSS
    // che passo come primo argomento alla funzione cheerio. Il secondo argomento
    // passato è `body`, che contiene l'HTML della pagina.

    var elements = cheerio('#mdb_lista > article', body);

    // Per ciascuno degli elementi trovati eseguo una funzione, che sarà
    // invocata con due argomenti: il primo è l'indice, il secondo è l'elemento corrente
    // nel ciclo.

    elements.each(function(index, element) {

      // Definisco un oggetto `venue` all'interno del quale salverò le informazioni
      // che mi servono.

      var venue = {};

      // Dichiaro una variabile `addressLink` all'interno della quale salverò il link
      // che contiene le coordinate geografiche del teatro.
      // Il link è fatto così:
      //
      //    <a href="/includes/ros/modal/mappe/index.asp?Latitudine=45.4671450&Longitudine=9.1979533&Nome_Location=Teatro+San+Babila" data-toggle="modal" data-target="#mdb_modal_mappa" role="button" rel="nofollow">Apri Mappa</a>
      //
      // e a noi serve `Latitudine` e `Longitudine`.

      var addressLink;

      // Definisco una variabile `tokens` all'interno della quale salverò, volta per volta,
      // dei "pezzi" di stringa. Mi servirà per arrivare ad ottenere i valori di
      // `Latitudine` e `Longitudine`.

      var tokens;

      // Definisco due variabili, `latitude` e `longitude`, in cui salverò questi valori.

      var latitude, longitude;

      // Per prima cosa salvo in `venue.name` il nome del teatro.
      // Utilizzo cheerio per trovare, tramite un selettore CSS, l'elemento HTML che
      // contiene il nome del teatro. Sul risultato della chiamta a cheerio, chiamo
      // il metodo `.text()` che mi restituisce il contenuto del nodo HTML.

      venue.name = cheerio('header h1 > a', element).text();

      // Per le coordinate c'è da fare un po' di lavoro in più.
      // Utilizzo ancora cheerio per trovare l'elemento HTML che contiene le coordinate.
      // Passo come primo argomento il selettore, e come secondo il nodo HTML che
      // contiene l'elemento.

      addressLink = cheerio('header .media-body aside a[data-target="#mdb_modal_mappa"]', element);

      // Una volta trovato l'elemento, riassegno alla variabile addressLink il contenuto
      // del suo attributo `href`.

      addressLink = addressLink.attr('href');

      // A questo punto, all'interno di `addressLink` avrò:
      //
      //    /includes/ros/modal/mappe/index.asp?Latitudine=45.4671450&Longitudine=9.1979533&Nome_Location=Teatro+San+Babila
      //
      // e a me non serve tutta la stringa, ma solo alcune parti.
      //
      // Il modo più semplice per arrivare a quello che mi serve è "spezzettare" la stringa fino ad arrivare
      // alle informazioni di cui ho bisogno. Per prima cosa, quindi, divido in due la stringa scegliendo come
      // carattere di separazione il punto di domanda `?`, che in una URL demarca il punto di inizio della
      // query string. Per farlo uso la funzione `split` di String.

      tokens = addressLink.split('?');

      // Il risultato sarà un array di due elementi:
      //
      //    [
      //      "/includes/ros/modal/mappe/index.asp",
      //      "Latitudine=45.4671450&Longitudine=9.1979533&Nome_Location=Teatro+San+Babila"
      //    ]
      //
      // che assegno alla variabile `tokens`. In `tokens[1]` ci sarà la porzione di stringa che mi interessa,
      // e sulla quale andrò avanti a lavorare.
      //
      // A questo punto, devo continuare a spezzettare. Dentro `tokens[1]` ho
      //
      //    "Latitudine=45.4671450&Longitudine=9.1979533&Nome_Location=Teatro+San+Babila"
      //
      // che è un elenco di parametri. In una URL, i parametri sono separati dalla e commerciale `&`.
      // Uso di nuovo la funzione `split` di String:

      tokens = tokens[1].split('&');

      // e questa volta ottengo un array di tre elementi:
      //
      //    [
      //      "Latitudine=45.4671450",
      //      "Longitudine=9.1979533",
      //      "Nome_Location=Teatro+San+Babila"
      //    ]
      //
      // che assegno di nuovo alla variabile `tokens`.
      // Quello che mi serve è nei primi due elementi di questo array (`tokens[0] e tokens[1]`).
      //
      // Per tirare fuori la latitudine, devo ulteriormente spezzettare la stringa `tokens[0]`,
      // questa volta utilizzando come carattere di separazione `=`.

      latitude = tokens[0].split('=');

      //
      // Il risultato sarà:
      //
      //    [
      //      "Latitudine",
      //      "45.4671450"
      //    ]
      //
      //
      // Quello che cerco è, finalmente, nel secondo elemento di questo array. Riassegno questo valore
      // alla variabile `latitude`.

      latitude = latitude[1];

      // Stessa storia per la longitudine.

      longitude = tokens[1].split('=')[1];

      // A questo punto, memorizzo in `venue.coords` le informazioni che ho trovato.
      //
      // Per assicurarmi che l'array contenga dei valori numerici e non delle stringhe,
      // utilizzo la funzione `parseFloat`, che prende come argomento una stringa e restituisce
      // un numero (preservando i decimali).

      venue.coords = [
        parseFloat(latitude),
        parseFloat(longitude)
      ];

      // Come ultima operazione, inserisco in coda all'array `venues` il mio oggetto `venue`.

      venues.push(venue);
    });

    // Dopo aver finito di ciclare sugli elementi, invoco la callback che viene passata alla funzione
    // `fetchVenues`. In questo modo comunico alla libreria `async` che ho terminato la
    // mia operazione. Passo come secondo argomento il risultato, che è il mio array `venues`.

    callback(null, venues);
  });
}

// Utilizzando la libreria async, metto in coda una serie di callback (che sono le mie
// chiamate a `fetchVenues`). Quando tutte queste callback saranno state eseguite ed avranno
// restituito un valore, verrà invocata la funzione passata come terzo argomento ad `async.map`.
//
// Questa callback viene invocata con due argomenti.
// Il primo è `error`, e contiene un oggetto che rappresenta un eventuale errore oppure `undefined`
// se non ci sono stati errori. Il secondo è `result`, che è un array che contiene i valori
// restituiti da tutte le chiamate a `fetcVenues`. Per ogni pagina, il risultato di questa funzione
// sarà un array con dentro una serie di oggetti venue:
//
//   {
//     "name": "Teatro Strehler, Milano",
//     "coords": [
//       45.4720884,
//       9.1825041
//     ]
//   }
//

async.map(paths, fetchVenues, function(error, result) {

  // Prima di scrivere il nostro file, dobbiamo lavorare su `result.`
  // Avrà una struttura del genere:
  //
  //    [
  //      [
  //        {
  //          "name": "Teatro Strehler, Milano",
  //          "coords": [
  //            45.4720884,
  //            9.1825041
  //          ]
  //        },
  //        {
  //          "name": "Teatro Grassi, Milano",
  //          "coords": [
  //            45.4664684,
  //            9.1847167
  //          ]
  //        },
  //        {
  //          ...
  //        }
  //      ],
  //
  //      [
  //        {
  //          "name": "Piccolo Teatro Studio Melato, Milano",
  //          "coords": [
  //            45.4723771,
  //            9.1829
  //          ]
  //        },
  //        {
  //          "name": "Teatro Franco Parenti, Milano",
  //          "coords": [
  //            45.4544416,
  //            9.2059056
  //          ]
  //        },
  //        {
  //          ...
  //        }
  //      ]
  //    ]
  //
  // Siccome `result` è un array che contiene a sua volta altri array,
  // decido di "appiattirlo" con questa tecnica.

  var venues = result.reduce(function(a, b) {
    return a.concat(b);
  });

  // Prima di scrivere il file, devo trasformare la mia struttura dati in una stringa.
  // Lo faccio utilizzando `JSON.stringify`.

  var JSONString = JSON.stringify({ venues: venues }, null, 2);

  // Utilizzo la funzione `writeFile` di `fs` per salvare il mio file.
  // Il primo argomento è il percorso del file (che sarà salvato nella
  // stessa cartella del file crawler.js). Il secondo argomento è il contenuto del file,
  // il terzo argomento è invece una funzione che viene eseguita alla fine della scrittura.
  // Utilizziamo questa funzione semplicemente per visualizzare un messaggio che ci conferma
  // l'avvenuta scrittura oppure un eventuale problema.

  fs.writeFile('venues.json', JSONString, function(error) {
    if (!error) {
      console.log('All venues have been written to venues.json file!');
    } else {
      console.log('Error writing venues.json!', error);
    }
  });
});
