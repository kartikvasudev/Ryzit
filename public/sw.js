importScripts('/idb.js')
importScripts('/utility.js')
var STATIC_CACHE = 'static-v3'
var DYNAMIC_CACHE = 'dynmaic-v1'

var staticFiles = [
    // 'https://ryzit.herokuapp.com',
    // 'https://ryzit.herokuapp.com/signup',
    // 'https://ryzit.herokuapp.com/offline',
    '/',
    '/signup',
    '/offline',
    '../views/index/home.ejs',
    '../views/index/signup.ejs',
    './assets/img/brand/favicon.png',
    'https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700',
    './assets/vendor/nucleo/css/nucleo.css',
    './assets/vendor/@fortawesome/fontawesome-free/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
    './assets/css/argon.css?v=1.2.0',
    './assets/vendor/jquery/dist/jquery.min.js',
    './assets/vendor/bootstrap/dist/js/bootstrap.bundle.min.js',
    './assets/vendor/js-cookie/js.cookie.js',
    './assets/vendor/jquery.scrollbar/jquery.scrollbar.min.js',
    './assets/vendor/jquery-scroll-lock/dist/jquery-scrollLock.min.js',
    './assets/vendor/chart.js/dist/Chart.min.js',
    './assets/vendor/chart.js/dist/Chart.extension.js',
    './assets/js/argon.js?v=1.2.0',
    './assets/img/brand/blue.png',
    './assets/img/brand/white.png',
    './assets/img/brand/Ryzit Dark.png',
    './manifest.json',
    './icons/48x48.png',
    './icons/96x96.png',
    './icons/144x144.png',
    './icons/384x384.png',
    './icons/512x512.png',
    './assets/vendor/nucleo/fonts/nucleo-icons.woff',
    './assets/vendor/nucleo/fonts/nucleo-icons.eot',
    './assets/vendor/nucleo/fonts/nucleo-icons.svg',
    './assets/vendor/nucleo/fonts/nucleo-icons.ttf',
    './assets/vendor/nucleo/fonts/nucleo-icons.woff2',
    '../views/offline/offline.ejs',
]

function trimCache(cacheName,maxItems){
  caches.open(cacheName)
  .then( cache => {
    return cache.keys()
    .then( keys => {
      if(keys.length > maxItems ){
        cache.delete(keys[0])
        .then( trimCache(cacheName,maxItems) )
      }
    } )
  } )
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
        .then( cache => {
            cache.addAll(staticFiles)
        } )
    )
} )

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
          .then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
              if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
                return caches.delete(key);
              }
            }));
          })
      );
      return self.clients.claim();
} )  

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
        .then( res => {
            return caches.open(DYNAMIC_CACHE)
            .then( cache => {
                trimCache(DYNAMIC_CACHE,50)
                cache.put(event.request.url,res.clone())
                return res
            } )
        } )
        .catch( err => {
            console.log(err)
            return caches.match(event.request)
            .then( response => {
                if(response){
                    return response
                }else{
                    return caches.open(STATIC_CACHE)
                    .then(cache => {
                        return cache.match('/offline')
                    })
                }
            } )
        } )
    )
} )

self.addEventListener('notificationclick', event => {
  var notification = event.notification;
  var action = event.action;
  console.log(notification)

  if(action === 'confirm'){
    // console.log("Confirm was chosen");
    notification.close(); //to close it
  }else{
    console.log(action);
    event.waitUntil(
      clients.matchAll()
      .then( clis => {
         var client = clis.find( c => {
           return c.visibilityState === 'visible'
         } );
         if(client !== 'undefined' ){
           client.navigate(notification.data.openUrl); //if app is already opened
           client.focus()
         }else{ 
           client.openWindow(notification.data.openUrl) //to open
         }

      } )
    )
    notification.close()
  }
} )

self.addEventListener('notificationclose',event => {
  console.log('Notification was closed',event)
})

self.addEventListener('push', event => {
  console.log("push notification received",event)
  var data = { title : "New Post",content : 'Something new happened',openUrl : '/' }
  if(event.data){
    data = JSON.parse(event.data.text());
  }
  var options = {
    body :  data.content ,
    icon : 'https://i.ibb.co/Gczz9Fs/96x96.png',
    image : data.image,
    dir : 'ltr',
    lang : 'en-US' ,//BCP 47
    vibrate : [100,50,200],
    badge : 'https://i.ibb.co/Gczz9Fs/96x96.png', 
    tag : 'confirm-notification', //same ones are show only once
    renotify : true, // same tag will vibrate
    data : {
      openUrl : data.openUrl
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
    )

} )