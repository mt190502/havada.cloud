const elements = {
  cloudContainer: document.querySelector('.cloud-container'),
  controlPanel: document.getElementById('control-panel'),
  togglePanelButton: document.getElementById('toggle-panel-button'),
  density: document.getElementById('density'),
  speed: document.getElementById('speed'),
  starCount: document.getElementById('starCount'),
  scrollingText: document.getElementById('scrollingText'),
  showScrollingTextButton: document.getElementById('showScrollingText'),
  skyColor1: document.getElementById('skyColor1'),
  skyColor2: document.getElementById('skyColor2'),
  cloudColor: document.getElementById('cloudColor'),
  densityValue: document.getElementById('densityValue'),
  speedValue: document.getElementById('speedValue'),
  starCountValue: document.getElementById('starCountValue'),
  themeButtons: document.querySelectorAll('.theme-button'),
  resetSettingsButton: document.getElementById('resetSettingsButton'),
};

let config = {
  density: 50,
  speed: 10,
  starCount: 15,
  scrollingText: 'Havada bulut\nSen o işi unut',
  baseSpawnInterval: 2500,
  colors: { sky: ['#87CEEB', '#E0F6FF'], cloud: '#f8f9fa' },
  manualTheme: false,
  activeManualThemeKey: 'morning',
  starRespawnInterval: 7000,
  cloudLinks: [
    'https://discord.com/vanityurl/dotcom/steakpants/flour/flower/index11.html',
    'https://www.youtube.com/watch?v=9wvEwPLcLcA',
    'https://www.youtube.com/watch?v=atgsMDLGp6o',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  ]
};

const CONFIG_STORAGE_KEY = 'skySimulatorConfig';

function saveConfig() {
  try {
    const { manualTheme, activeManualThemeKey, ...restConfig } = config;
    const configToSave = restConfig;
    sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
  } catch (error) {
    console.error("Error saving config to sessionStorage:", error);
  }
}

function loadConfig() {
  try {
    const storedConfig = sessionStorage.getItem(CONFIG_STORAGE_KEY);
    if (storedConfig) {
      const loadedConfig = JSON.parse(storedConfig);
      Object.assign(config, loadedConfig);
    }
  } catch (error) {
    console.error("Error loading config from sessionStorage:", error);
  }
  config.manualTheme = false;
  config.activeManualThemeKey = 'morning';
}

function fadeOutAndRemove(element, animationName = 'starFadeOut', duration = '2s', onEndCallback) {
  if (!(element instanceof HTMLElement)) return;
  element.style.animation = `${animationName} ${duration} ease-in-out forwards`;
  element.addEventListener(
    'animationend',
    () => {
      element.remove();
      if (onEndCallback) onEndCallback();
    },
    { once: true }
  );
}

const themes = {
  morning: { hours: [6, 12], sky: ['#87CEEB', '#E0F6FF'], cloud: '#f8f9fa' },
  noon: { hours: [12, 18], sky: ['#00B4D8', '#90E0EF'], cloud: '#ffffff' },
  evening: { hours: [18, 24], sky: ['#023E8A', '#03045E'], cloud: '#e2eafc' },
  night: { hours: [0, 6], sky: ['#012A4A', '#001219'], cloud: '#adb5bd' },
};

function getTimeKey() {
  const h = new Date().getHours();
  return Object.keys(themes).find((k) => h >= themes[k].hours[0] && h < themes[k].hours[1]) || 'night';
}

function updateValueDisplays() {
  if (elements.densityValue) elements.densityValue.textContent = `${config.density}%`;
  if (elements.speedValue) elements.speedValue.textContent = `${config.speed}s`;
  if (elements.starCountValue) elements.starCountValue.textContent = `${config.starCount}`;
}

function updateSky() {
  document.body.style.background = `linear-gradient(to bottom, ${config.colors.sky[0]}, ${config.colors.sky[1]})`;
  document.documentElement.style.setProperty('--cloud-base-color', config.colors.cloud);
}

function toggleStarsControl(show) {
  if (elements.starCount && elements.starCount.parentElement) {
    elements.starCount.parentElement.style.display = show ? 'block' : 'none';
  }
}

function createCelestial(type) {
  const el = document.createElement('div');
  el.className = type;
  el.innerHTML = type === 'sun' ? '☀️' : '🌙';
  el.style.cssText = `position:fixed;z-index:1;font-size:${type === 'sun' ? 60 : 50}px;animation:${type}Glow ${
    type === 'sun' ? 3 : 4
  }s ease-in-out infinite alternate;${type === 'sun' ? 'top:10%;right:15%' : 'top:15%;left:20%'};`;
  return el;
}

function isStarMode() {
  let currentEffectiveThemeKey = getTimeKey();
  if (config.manualTheme && config.activeManualThemeKey && themes[config.activeManualThemeKey]) {
    currentEffectiveThemeKey = config.activeManualThemeKey;
  }
  return ['evening', 'night'].includes(currentEffectiveThemeKey);
}

let starInterval = null;
function spawnStar() {
  const current = document.querySelectorAll('.star').length;
  if (current >= config.starCount) return;
  const s = document.createElement('div');
  s.className = 'star';
  s.innerHTML = '⭐';
  Object.assign(s.style, {
    position: 'fixed',
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    fontSize: `${15 + Math.random() * 15}px`,
    opacity: 0,
    animation: 'starFadeIn 2s ease-in-out forwards',
    zIndex: 1,
  });
  document.body.appendChild(s);
}

function randomRespawn() {
  const stars = document.querySelectorAll('.star');
  if (!stars.length) return;
  const s = stars[Math.floor(Math.random() * stars.length)];
  fadeOutAndRemove(s, 'starFadeOut', '2s', () => {
    if (isStarMode()) spawnStar();
  });
}

function clearStarsFade() {
  document.querySelectorAll('.star').forEach((s) => fadeOutAndRemove(s));
}

function startStarCycle() {
  for (let i = 0; i < config.starCount; i++) spawnStar();
  if (!starInterval)
    starInterval = setInterval(() => {
      if (isStarMode()) randomRespawn();
    }, config.starRespawnInterval);
}

function stopStarCycle() {
  clearInterval(starInterval);
  starInterval = null;
  clearStarsFade();
}

function applyTheme(requestKey, manual = false) {
  config.manualTheme = manual;

  let themeToApplyKey;

  if (!config.manualTheme) {
    themeToApplyKey = getTimeKey();
  } else {
    themeToApplyKey = requestKey;
    config.activeManualThemeKey = requestKey;
  }

  const th = themes[themeToApplyKey];
  if (!th) {
    console.warn(`Theme not found for key: ${themeToApplyKey}`);
    return;
  }

  [config.colors.sky[0], config.colors.sky[1]] = th.sky;
  config.colors.cloud = th.cloud;
  updateSky();

  document.querySelectorAll('.sun,.moon').forEach((e) => e.remove());
  document.body.appendChild(createCelestial(['morning', 'noon'].includes(themeToApplyKey) ? 'sun' : 'moon'));

  const isNightTimeTheme = ['evening', 'night'].includes(themeToApplyKey);
  toggleStarsControl(isNightTimeTheme);
  if (isNightTimeTheme) {
    if (!starInterval) startStarCycle();
  } else {
    if (starInterval) stopStarCycle();
  }

  elements.themeButtons.forEach((btn) => {
    if (btn instanceof HTMLElement && btn.dataset.theme) {
      const isActive = config.manualTheme ? (btn.dataset.theme === themeToApplyKey) : (btn.dataset.theme === 'auto');
      btn.classList.toggle('active', isActive);
    }
  });

  if (elements.skyColor1 && elements.skyColor1 instanceof HTMLInputElement) elements.skyColor1.value = config.colors.sky[0];
  if (elements.skyColor2 && elements.skyColor2 instanceof HTMLInputElement) elements.skyColor2.value = config.colors.sky[1];
  if (elements.cloudColor && elements.cloudColor instanceof HTMLInputElement) elements.cloudColor.value = config.colors.cloud;

  saveConfig();
}

function createCloud() {
  const c = document.createElement('div'),
    type = Math.ceil(Math.random() * 5),
    speed = config.speed;
  c.className = `cloud cloud-type-${type}`;
  c.style.cssText = `--target-opacity:${(Math.random() * 3 + 7) / 10};opacity:var(--target-opacity);transform:scaleX(${
    Math.random() + 0.9
  });top:${Math.random() * 95}vh;left:-400px;animation:moveCloud ${speed}s linear forwards;cursor:pointer;`;
  
  const isLinkCloud = Math.random() < 0.2;
  if (isLinkCloud) {
    const randomLink = config.cloudLinks[Math.floor(Math.random() * config.cloudLinks.length)];
    c.style.cursor = 'pointer';
    c.title = 'Click to visit link';
    c.onclick = (e) => {
      e.preventDefault();
      window.open(randomLink, '_blank');
    };
  } else {
    c.style.cursor = 'pointer';
    c.title = 'Click to pop cloud';
    c.onclick = () => {
      c.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      c.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
      c.style.transition = 'opacity 2s ease-out, filter 2s ease-out, transform 2s ease-out';
      
      const before = c.querySelector('::before');
      const after = c.querySelector('::after');
      if (before) before.style.transition = 'all 2s ease-out';
      if (after) after.style.transition = 'all 2s ease-out';
      
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          c.remove();
        } else {
          c.style.opacity = opacity;
          c.style.transform = `scaleX(${Math.random() + 0.9}) scale(${1 + (1 - opacity) * 0.5})`;
          c.style.filter = `blur(${(1 - opacity) * 5}px)`;
        }
      }, 100);
    };
  }
  
  c.addEventListener('animationend', () => c.remove(), { once: true });
  if (elements.cloudContainer) {
    elements.cloudContainer.appendChild(c);
  }
}
let cloudInterval;
function restartClouds() {
  clearInterval(cloudInterval);
  cloudInterval = setInterval(createCloud, (config.baseSpawnInterval * (105 - config.density)) / 100);
}

function setControls() {
  if (elements.togglePanelButton && elements.controlPanel) {
    elements.togglePanelButton.onclick = () => {
      if (elements.controlPanel) {
        elements.controlPanel.classList.toggle('hidden');
        if (elements.togglePanelButton) {
          elements.togglePanelButton.textContent = elements.controlPanel.classList.contains('hidden') ? '☰' : '✕';
        }
      }
    };
  }

  if (elements.density && elements.density instanceof HTMLInputElement) {
    elements.density.oninput = (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        config.density = Math.max(5, Math.min(100, +target.value));
        updateValueDisplays();
        restartClouds();
        saveConfig();
      }
    };
  }

  if (elements.speed && elements.speed instanceof HTMLInputElement) {
    elements.speed.oninput = (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        config.speed = +target.value;
        updateValueDisplays();
        saveConfig();
      }
    };
  }

  function adjustStarCount(newCount, oldCount) {
    if (!isStarMode()) return;
    const diff = newCount - oldCount;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) spawnStar();
    } else if (diff < 0) {
      const starsToRemove = Math.abs(diff);
      const currentStars = Array.from(document.querySelectorAll('.star'));
      for (let i = 0; i < starsToRemove && i < currentStars.length; i++) {
        const starToRemove = currentStars[i];
        if (starToRemove) {
          fadeOutAndRemove(starToRemove);
        }
      }
    }
  }

  if (elements.starCount && elements.starCount instanceof HTMLInputElement) {
    elements.starCount.oninput = (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        const newCount = Math.max(5, Math.min(30, +target.value));
        const oldCount = config.starCount;
        config.starCount = newCount;
        updateValueDisplays();
        adjustStarCount(newCount, oldCount);
        saveConfig();
      }
    };
  }

  if (elements.scrollingText && elements.scrollingText instanceof HTMLTextAreaElement) {
    elements.scrollingText.oninput = (e) => {
      const target = e.target;
      if (target instanceof HTMLTextAreaElement) {
        config.scrollingText = target.value;
        saveConfig();
      }
    };
  }

  if (elements.showScrollingTextButton) {
    elements.showScrollingTextButton.onclick = () => createScrollingText(true);
  }

  (['skyColor1', 'skyColor2', 'cloudColor']).forEach((id) => {
    const element = elements[id];
    if (element && element instanceof HTMLInputElement) {
      element.oninput = (e) => {
        const target = e.target;
        if (target instanceof HTMLInputElement) {
          const targetValue = target.value;
          if (id.startsWith('sky')) {
            config.colors.sky[id === 'skyColor1' ? 0 : 1] = targetValue;
          } else {
            config.colors.cloud = targetValue;
          }
          updateSky();
          config.manualTheme = true;
          saveConfig();
        }
      };
    }
  });
  elements.themeButtons.forEach((btn) => {
    if (btn instanceof HTMLElement) {
      btn.onclick = () => {
        if (btn.dataset.theme) {
          applyTheme(btn.dataset.theme, btn.dataset.theme !== 'auto');
        }
      };
    }
  });

  if (elements.resetSettingsButton) {
    elements.resetSettingsButton.onclick = () => {
      sessionStorage.removeItem(CONFIG_STORAGE_KEY);
      location.reload();
    };
  }
}

let scrollingTextTimeout = null;

function createScrollingText(forceReplace = false) {
  const existingText = document.querySelector('.scrolling-text');
  clearTimeout(scrollingTextTimeout);

  const spawnNewText = () => {
    if (document.querySelector('.scrolling-text') && !forceReplace) return;

    const t = document.createElement('div');
    t.className = 'scrolling-text';
    t.innerHTML = config.scrollingText.replace(/\n/g, '<br>');
    t.style.cssText = `position:fixed;
    top:${20 + Math.random() * 60}%;
    left:0;
    transform:translateY(-50%);
    white-space:nowrap;
    pointer-events:none;
    z-index:100;
    font-size:${18 + Math.random() * 20}px;
    color:rgba(255,255,255,0.9);
    text-shadow:2px 2px 4px rgba(0,0,0,0.7);
    animation:scrollText 15s linear forwards;
    opacity:0;
    transition:opacity 1s ease-in-out`;
    
    document.body.appendChild(t);
    
    t.offsetHeight;
    t.style.opacity = '1';
    
    t.onanimationend = () => {
      t.remove();
      createScrollingText(false);
    };
  };

  if (existingText && existingText instanceof HTMLElement) {
    if (forceReplace) {
      const rect = existingText.getBoundingClientRect();      
      const newText = document.createElement('div');
      newText.className = 'scrolling-text';
      newText.innerHTML = existingText.innerHTML;
      newText.style.cssText = `position:fixed;
      top:${rect.top + (rect.height / 2)}px;
      left:${rect.left}px;
      transform:translateY(-50%);
      white-space:nowrap;
      pointer-events:none;
      z-index:100;
      font-size:${existingText.style.fontSize};
      color:rgba(255,255,255,0.9);
      text-shadow:2px 2px 4px rgba(0,0,0,0.7);
      opacity:1;
      transition:opacity 1s ease-in-out`;
      
      existingText.remove();
      document.body.appendChild(newText);
      
      setTimeout(() => {
        newText.style.opacity = '0';
        
        setTimeout(() => {
          newText.remove();
          spawnNewText();
        }, 1000);
      }, 0);
    }
  } else {
    spawnNewText();
  }
}

function updateControlValuesFromConfig() {
  if (elements.density && elements.density instanceof HTMLInputElement) elements.density.value = String(config.density);
  if (elements.speed && elements.speed instanceof HTMLInputElement) elements.speed.value = String(config.speed);
  if (elements.starCount && elements.starCount instanceof HTMLInputElement) elements.starCount.value = String(config.starCount);
  if (elements.scrollingText && elements.scrollingText instanceof HTMLTextAreaElement) elements.scrollingText.value = config.scrollingText;
}

function init() {
  loadConfig();
  applyTheme(config.manualTheme ? config.activeManualThemeKey : 'auto', config.manualTheme);
  setControls();
  updateControlValuesFromConfig();
  updateValueDisplays();
  restartClouds();
  createCloud();
  createCloud();
  createScrollingText(false);
  setInterval(() => {
    if (!config.manualTheme) applyTheme('auto');
  }, 30 * 60 * 1000);
}
document.addEventListener('DOMContentLoaded', init);
