import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvswi7XteimXcZ84eGmMupADNh-XYnZGw",
  authDomain: "link-57c36.firebaseapp.com",
  projectId: "link-57c36",
  storageBucket: "link-57c36.firebasestorage.app",
  messagingSenderId: "740196638913",
  appId: "1:740196638913:web:07fb982879d1976b5f7440",
  measurementId: "G-RXX3MYQMXJ"
};

const app = initializeApp(firebaseConfig);

isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});
