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
 *
 * La struttura finale del file sarà:
 *
 *   {
 *     "venues": [
 *       {
 *         "name": "Teatro Strehler, Milano",
 *         "coords": [
 *           45.4720884,
 *           9.1825041
 *         ],
 *         "events": [
 *           {
 *             "title": "Certe notti, Milano",
 *             "startsAt": "2015-06-17T22:00:00.000Z",
 *             "endsAt": "2015-06-20T22:00:00.000Z"
 *           },
 *           ...
 *         ]
 *       },
 *       {
 *         "name": "Piccolo Teatro Studio Melato, Milano",
 *         "coords": [
 *           45.4723771,
 *           9.1829
 *         ],
 *         "events": []
 *       },
 *       ...
 *     ]
 *   }
 *
 */

/**
 * Sezione 1: Dipendenze
 */

// `request` è una libreria che ci permette di fare chiamate HTTP.
var request = require('request');

// `cheerio` serve per estrarre informazioni da un documento HTML.
// È molto simile a jQuery e ci permette di selezionare nodi HTML
// utilizzando dei selettori CSS.
var cheerio = require('cheerio');

// `moment` è una libreria che ci aiuta a lavorare con le date.
var moment = require('moment');

// `async` è una libreria che ci permette di gestire le callback.
// Più avanti nel file vedremo di cosa si tratta.
var async = require('async');

// `fs` è una libreria per leggere e scrivere files. Ci servirà per
// salvare il file JSON contenente l'elenco dei teatri.
var fs = require('fs');

// `url` ci permette di fare il parsing di una URL. Nel nostro esempio
// utilizzeremo sia una tecnica "manuale" di estrazione di informazioni
// da una URL (a scopo puramente didattico), sia questa libreria.
var urlLib = require('url');

/**
 * Sezione 2: Implementazione
 */

// Definisco un array che contiene un elenco di pagine in cui mi aspetto di trovare le informazioni.
var urls = [
  'http://www.milanodabere.it/milano/teatri',
  'http://www.milanodabere.it/milano/teatri/2',
  'http://www.milanodabere.it/milano/teatri/3',
  'http://www.milanodabere.it/milano/teatri/4',
  'http://www.milanodabere.it/milano/teatri/5'
];

// Utilizzando la libreria async, metto in coda una serie di callback (che sono le mie
// chiamate a `fetchVenues`). Quando tutte queste callback saranno state eseguite (una per ogni elemento
// dell'array `urls`) ed avranno restituito un valore, verrà invocata la funzione passata
// come terzo argomento, `saveVenues`.
async.map(urls, fetchVenues, saveVenues);

// Definisco la funzione `fetchVenues`, che sarà eseguita su ciascuna delle pagine che
// saranno visitate dal crawler. Sarà invocata con due parametri, `url` e `callback`.
function fetchVenues(url, callback) {
  // Definisco un array vuoto `venues` all'interno del quale memorizzerò tutti i teatri
  // che troverò nella pagina corrente.
  var venues = [];

  // La funzione `request` accetta come primo argomento un indirizzo web completo
  // (es. http://www.milanodabere.it/milano/teatri), e come secondo argomento
  // una funzione di callback che sarà eseguita nel momento in cui il server
  // avrà risposto con un documento HTML.
  // Questa funzione di callback, a sua volta, sarà invocata con tre parametri.
  // Il primo, `error`, conterrà `undefined` se il server risponderà correttamente,
  // altrimenti conterrà un oggetto che descriverà l'errore.
  // Il secondo, `response`, conterrà un oggetto che descrive la risposta HTTP che ci è
  // stata inviata dal server.
  // Il terzo, `body`, conterrà l'HTML della pagina dal quale dovremo estrarre le
  // informazioni che cerchiamo.
  request(url, function(error, response, body) {
    if (error) {
      callback(error, venues);
      return;
    }

    // Salvo all'interno di `elements` tutti gli elementi HTML che contengono
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
      // e a noi serve estrarre i valori di `Latitudine` e `Longitudine`.
      var addressLink;

      // Definisco una variabile `tokens` all'interno della quale salverò, volta per volta,
      // dei "pezzi" di stringa. Mi servirà per arrivare ad ottenere i valori di
      // `Latitudine` e `Longitudine`.
      var tokens;

      // Definisco due variabili, `latitude` e `longitude`, in cui salverò questi valori.
      var latitude, longitude;

      // Dichiaro una variabile `eventsLink` che mi servirà per memorizzare il link alla pagina eventi
      // per il teatro corrente.
      var eventsLink;

      // Per prima cosa salvo in `venue.name` il nome del teatro.
      // Utilizzo cheerio per trovare, tramite un selettore CSS, l'elemento HTML che
      // contiene il nome del teatro. Sul risultato della chiamta a cheerio, chiamo
      // il metodo `.text()` che mi restituisce il contenuto del nodo HTML.
      venue.name = cheerio('header .row a', element).text();

      // Per le coordinate faremo un po' di lavoro in più.
      // Utilizzo ancora cheerio per trovare l'elemento HTML che contiene le coordinate.
      // Passo come primo argomento il selettore, e come secondo il nodo HTML che
      // contiene l'elemento.
      addressLink = cheerio('a[data-target="#mdb_modal_mappa"]', element);

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
      // sulla quale andrò avanti a lavorare.
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

      // Il risultato sarà:
      //
      //    [
      //      "Latitudine",
      //      "45.4671450"
      //    ]
      //
      // Quello che cerco è, finalmente, nel secondo elemento di questo array. Riassegno questo valore
      // alla variabile `latitude`.
      latitude = latitude[1];

      // Stessa storia per la longitudine, che si trova in `tokens[1]`.
      longitude = tokens[1].split('=')[1];

      // Estrarre informazioni da una URL è un compito molto ricorrente in programmazione
      // web, e naturalmente in node.js esiste una libreria che ci evita tutto questo sbattimento
      // di spezzettare le stringhe. Vediamo rapidamente come si usa.
      //
      // Invoco il metodo `parse` di `urlLib` (che è una istanza della libreria `url` di node.js),
      // passando come primo parametro la URL (anche parziale), e come secondo parametro `true`.
      var parsedURL = urlLib.parse(url + addressLink, true);

      // La libreria ha quindi prodotto per me un oggetto che rappresenta la URL.
      // Le informazioni di cui ho bisogno sono comodamente accessibili all'interno di `parsedURL.query`.
      // Decommenta il `console.log` sottostante per vederle stampate durante l'esecuzione del crawler.
      //
      // console.log(
      //   "Informations extracted with `url.parse`:",
      //   parsedURL.query.Nome_Location,
      //   parsedURL.query.Latitudine,
      //   parsedURL.query.Longitudine
      // );

      // A questo punto, memorizzo in `venue.coords` le informazioni che ho trovato.
      // Per assicurarmi che l'array contenga dei valori numerici e non delle stringhe,
      // utilizzo la funzione `parseFloat`, che prende come argomento una stringa e restituisce
      // un numero (preservando i decimali).
      venue.coords = [
        parseFloat(latitude),
        parseFloat(longitude)
      ];

      // Seleziono il link degli eventi.
      eventsLink = cheerio('a[href*="/eventi"]', element);

      // Siccome il link potrebbe non essere presente, utilizzo la proprietà `.length`
      // di eventsLink che mi restituirà un valore diverso da 0 nel caso in cui, nell'elemento
      // corrente, sia stato trovato questo link.
      if (eventsLink.length) {
        // Se trovato, lo completo aggiungendo le informazioni relative al protocollo e all'host
        // che ho precedentemente memorizzato all'interno di `parsedURL`, e lo salvo come
        // proprietà dell'oggetto `venue`.
        venue.eventsURL = parsedURL.protocol + '//' + parsedURL.host + eventsLink.attr('href');
      }

      // Come ultima operazione, inserisco in coda all'array `venues` il mio oggetto `venue`.
      venues.push(venue);
    });

    // Dopo aver ciclato sugli elementi, chiamo async.map passando tutte le venues trovate nella pagina,
    // e su ciascuna di queste eseguirò una funzione che estrarrà da queste gli eventi presenti nella
    // pagina contenuta in `eventsURL`.
    async.map(venues, fetchEvents, function(error, result) {
      // Quando async.map avrà finito di applicare le callback a tutte le mie venues, invocherò
      // la callback passando il risultato finale (ossia tutte le venues con il payload degli eventi).
      callback(null, result);
    });
  });
}

// Questa funzione sarà invocata per ciascuna venue, e avrà lo scopo di aggiungere un payload
// `events` a tutte le venue che hanno una proprietà `eventsURL`.
function fetchEvents(venue, callback) {
  // Per prima cosa definisco una chiave `events`, inizializzata ad array vuoto.
  venue.events = [];

  // Se sulla venue non è settata la proprietà `eventsURL`, vuol dire che per questa venue non era
  // presente nessun link agli eventi, quindi usciamo dalla funzione chiamando la callback, alla
  // quale passiamo `null` come primo argomento per comunicare che non ci sono stati errori, e il
  // nostro oggetto `venue` come secondo argomento.
  if (!venue.eventsURL) {
    callback(null, venue);
    return;
  }

  // Memorizzo nella variabile `url` l'indirizzo della pagina degli eventi.
  var url = venue.eventsURL;

  // Elimino la proprietà eventsUrl, non avendone bisogno nel payload finale.
  delete venue.eventsURL;

  // A questo punto, possiamo procedere con la chiamata tramite `request`.
  request(url, function(error, response, body) {
    if (error) {
      callback(error, venue);
      return;
    }

    // Anche questa volta, cerchiamo tutti gli eventi con un selettore simile a quello
    // utilizzato precedentemente.
    var elements = cheerio('#mdb_lista > article', body);

    // Ciascuno degli elementi trovati rappresenta un evento. Eseguiamo un ciclo su di essi per
    // estrarre le proprietà che ci interessano.
    elements.each(function(index, element) {
      // Inizializzo una variabile `event` con un oggetto vuoto.
      var event = {};
      var startsAt, endsAt;

      // Memorizzo alcune proprietà degli eventi che raggiungo con dei selettori CSS.
      event.title = cheerio('a[href*="/spettacoli"] span', element).text();

      // Salvo in `startsAt` ed `endsAt` le date di inizio e fine dell'evento.
      startsAt = cheerio('meta[itemprop="startDate"]', element).attr('content');
      endsAt = cheerio('meta[itemprop="endDate"]', element).attr('content');

      // Uso `moment` per fare il parsing delle date e per trasformarle in un formato ISO.
      event.startsAt = moment.utc(startsAt).startOf('day').toISOString();
      event.endsAt = moment.utc(endsAt).endOf('day').toISOString();

      // Al termine, inserisco il mio oggetto `event` all'interno di venue.events.
      venue.events.push(event);
    });

    // Chiamo la callback per comunicare alla libreria `async` che ho terminato le operazioni.
    callback(null, venue);
  });
}

// Definisco la funzione `saveVenues`, che sarà invocata da `async.map` una volta che tutte le pagine
// saranno state visitate dal crawler.
//
// Sarà invocata con due parametri. Il primo è `error`, e contiene un oggetto che rappresenta un
// eventuale errore oppure `undefined` se non ci sono stati errori.
// Il secondo è `result`, che è un array che contiene i valori restituiti da tutte le chiamate a `fetchVenues`.
//
// Ciascuna chiamata a `fetchVenues` restituisce a sua volta un array, quindi `result`
// avrà una struttura del genere:
//
//   [
//     [
//       {
//         "name": "Teatro Strehler, Milano",
//         "coords": [
//           45.4720884,
//           9.1825041
//         ]
//       },
//       {
//         "name": "Teatro Grassi, Milano",
//         "coords": [
//           45.4664684,
//           9.1847167
//         ]
//       },
//       {
//         ...
//       }
//     ],
//
//     [
//       {
//         "name": "Piccolo Teatro Studio Melato, Milano",
//         "coords": [
//           45.4723771,
//           9.1829
//         ]
//       },
//       {
//         "name": "Teatro Franco Parenti, Milano",
//         "coords": [
//           45.4544416,
//           9.2059056
//         ]
//       },
//       {
//         ...
//       }
//     ]
//   ]
//
// ossia un array di array (anche detto "array bidimensionale").
function saveVenues(error, result) {
  if (error) {
    console.log("Error fetching pages.", error);
    return;
  }

  // Prima di scrivere il nostro file, dobbiamo lavorare su `result`.
  // Siccome `result` è un array che contiene a sua volta altri array,
  // è necessario "appiattirlo", e per farlo utilizzeremo la funzione `Array.reduce`.
  //
  // `reduce` ci permette di applicare una callback su ogni elemento dell'array,
  // e di memorizzare il valore ritornato dalla callback in un contenitore, detto "accumulatore",
  // che sarà ritornato quando la funzione sarà stata applicata a tutti gli elementi dell'array.
  //
  // L'accumulatore è il primo parametro, `accumulator`, mentre l'elemento corrente è il
  // secondo, `currentElement`.
  // Il risultato che sarà ritornato dalla funzione `reduce` sarà quindi il concatenamento di tutti
  // gli array contenuti in `result`. Lo memorizziamo nella variabile `venues`.
  var venues = result.reduce(function(accumulator, currentElement) {
    return accumulator.concat(currentElement);
  });

  // Prima di scrivere il file, devo trasformare la mia struttura dati in una stringa.
  // Lo faccio utilizzando `JSON.stringify`.
  var JSONString = JSON.stringify({ venues: venues }, null, 2);

  // Per finire, usiamo la funzione `writeFile` di `fs` per scrivere il file.
  // Il primo argomento è il percorso del file (che sarà salvato nella
  // stessa cartella di crawler.js). Il secondo argomento è il contenuto del file come stringa,
  // il terzo argomento è invece una funzione che viene eseguita alla fine della scrittura.
  // Utilizziamo questa funzione semplicemente per visualizzare un messaggio che ci conferma
  // l'avvenuta scrittura, oppure un eventuale problema.
  fs.writeFile('venues.json', JSONString, function(error) {
    if (error) {
      console.log("Error writing venues.json", error);
      return;
    }

    console.log(venues.length + ' venues were saved to venues.json!');
  });
}
