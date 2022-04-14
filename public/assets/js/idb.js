// variable to hold db connection
let db

// establish a connection to IndexedDB database called 'pizza-hunt', set to version 1
const request = indexedDB.open('pizza-hunt', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called 'new-pizza', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

// on successful request
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded even above) or simply established a connection, save reference to db in global cariable
    db = event.target.result;

    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
        
        uploadPizza()
    }
};

// on error of request
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access the object store for 'new_pizza'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to your store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
    // open a transaction with the db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    //on successful .getAll() execution, run the following

    getAll.onsuccess = function() {
        // if data in IndexedDB store, send to api server

        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/jason'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse)
                }

                // open another transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');

                // access the new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');

                // clear all items in your store
                pizzaObjectStore.clear();

                alert('All saved pizza has been submitted!')
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online

window.addEventListener('online', uploadPizza);