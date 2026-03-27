try {
  require('./metro.config.js');
  console.log("SUCCESS");
} catch(e) {
  console.error("THE REAL ERROR:", e);
}
