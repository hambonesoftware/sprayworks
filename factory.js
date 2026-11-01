const mode=new URLSearchParams(location.search).get('mode');
if(mode==='crew') import('./src/main.js');
else if(mode==='corner') import('./src/corner.js');
else import('./src/clock.js');
