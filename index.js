const axios = require('axios');
const cheerio = require('cheerio');
const RSS = require('rss');
const fs = require('fs');
const schedule = require('node-schedule');
const express = require('express');

const URL = 'https://www.tourmag.com/airmag/';
const _URL = 'https://www.tourmag.com';

async function fetchArticles() {
  try {
    // Récupération du HTML de la page
    const response = await axios.get(URL);
    const $ = cheerio.load(response.data);

    // Création du flux RSS
    const feed = new RSS({
      title: 'TourMag AirMag - Flux RSS',
      description: 'Flux RSS généré automatiquement pour AirMag',
      feed_url: `${URL}rss.xml`,
      site_url: URL,
      language: 'fr',
    });

    // $('.rub_left').each(function () {
    //   console.log(
    //     '👉🏼👉🏼👉🏼 ~ fetchArticles ~ elem:',
    //     $(this).find('a').html().split('src="')[1].split('"')[0]
    //   );
    // });

    // Parcours des articles
    $('.rub_left').each(function () {
      const title = $(this).text().trim();
      const link = $(this).find('a').attr('href'); // Récupération du lien
      const fullLink = `${_URL}${link}`;
      const image = $(this).find('a').html().split('src="')[1].split('"')[0];
      const description = $(this).find('.resume_article').text().trim();

      // Ajout d'un article au flux RSS
      feed.item({
        title: title,
        description: `<img src="${image}" alt="${title}"/><p>${description}</p>`,
        url: fullLink,
      });
    });

    // Générer le XML du flux
    const rssXml = feed.xml({ indent: true });
    fs.writeFileSync('rss.xml', rssXml);

    console.log('Flux RSS mis à jour');
    return rssXml;
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des articles :',
      error.message
    );
  }
}

// Planification d'une mise à jour toutes les heures
schedule.scheduleJob('0 * * * *', () => {
  console.log('Mise à jour du flux RSS...');
  fetchArticles();
});

// API pour servir le flux RSS
const app = express();

app.get('/rss.xml', (req, res) => {
  const rssXml = fs.readFileSync('rss.xml', 'utf8');
  res.set('Content-Type', 'application/rss+xml');
  res.send(rssXml);
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Serveur RSS lancé sur http://localhost:${PORT}/rss.xml`)
);

// Mise à jour initiale
fetchArticles();
