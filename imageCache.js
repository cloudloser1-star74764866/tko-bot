// ============================================================
//  imageCache.js — Character image URL cache
//  Loads confirmed images instantly; fetches remaining ones
//  from AniList API in the background at startup.
//
//  ── IMAGE VERIFICATION POLICY ────────────────────────────────
//  SEED entries are hardcoded official image URLs — only change
//  after verifying on the character's official series page.
//  SEARCH_TERMS numeric values = direct AniList character IDs
//  (guaranteed correct character, no name-search ambiguity).
//  SEARCH_TERMS string values = name search (only use for chars
//  with no known AniList ID — keep names as specific as possible).
// ============================================================

const fs   = require('fs');
const path = require('path');

const CACHE_FILE    = path.join(__dirname, 'data', 'image_cache.json');
const OVERRIDE_FILE = path.join(__dirname, 'data', 'image_overrides.json');

let manualOverrides = {};

function loadOverrides() {
  try {
    if (fs.existsSync(OVERRIDE_FILE)) {
      manualOverrides = JSON.parse(fs.readFileSync(OVERRIDE_FILE, 'utf8'));
    }
  } catch (_) {}
}

function saveOverrides() {
  try {
    fs.writeFileSync(OVERRIDE_FILE, JSON.stringify(manualOverrides, null, 2));
  } catch (_) {}
}

// ── Seed: confirmed working image URLs ───────────────────────
const SEED = {
  // ── Naruto ───────────────────────────────────────────────────
  naruto_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
  sasuke_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png',
  itachi_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
  madara_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
  kaguya_ur:       'https://static.wikia.nocookie.net/naruto/images/6/6c/Kaguya_%C5%8Ctsutsuki.png/revision/latest',
  sakura_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b145-IorfpI8arxeX.png',
  sage_naruto_lt:  'https://static.wikia.nocookie.net/naruto/images/e/e9/Six_Paths_Sage_Mode_Naruto.png/revision/latest',
  sage_naruto:     'https://static.wikia.nocookie.net/naruto/images/e/e9/Six_Paths_Sage_Mode_Naruto.png/revision/latest',

  // ── Dragon Ball ───────────────────────────────────────────────
  goku_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b246-wsRRr6z1kii8.png',
  goku_ssj4_l:     'https://s4.anilist.co/file/anilistcdn/character/large/b246-wsRRr6z1kii8.png',
  goku_ssj4:       'https://s4.anilist.co/file/anilistcdn/character/large/b246-wsRRr6z1kii8.png',
  ultra_goku_lt:   'https://static.wikia.nocookie.net/dragonball/images/b/b9/Ultra_Instinct_Goku.png/revision/latest?cb=20180930060236',
  vegeta_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b913-NIFkKazWM8VO.png',
  beerus_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b76348-pGWrznfxgPIV.png',

  // ── One Piece ─────────────────────────────────────────────────
  luffy_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png',
  gear5_luffy_lt:  'https://static.wikia.nocookie.net/onepiece/images/0/06/Nika_Anime_Infobox.png/revision/latest?cb=20240407020958',
  zoro_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png',
  nami_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b723-vp5hPptgnNEC.png',
  usopp_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b724-GFGgI9AJQkfy.jpg',
  chopper_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b309-H64NhbJ2ywIQ.jpg',
  sanji_e:         'https://s4.anilist.co/file/anilistcdn/character/large/b305-6lisPmHtCnLT.png',
  sanji_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b305-6lisPmHtCnLT.png',
  robin_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b61-ywXUyyocEEqt.png',
  ace_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b2072-Lc6jEdsueJUK.jpg',
  law_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b13767-U604OJN9dxCn.jpg',
  kid_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b14989-uykLqnBTdAc2.jpg',
  shanks_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
  shanks_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
  mihawk_l:        'https://s4.anilist.co/file/anilistcdn/character/large/n2064-OpnF4nLi6bvL.png',
  whitebeard_my:   'https://s4.anilist.co/file/anilistcdn/character/large/b2751-NnzW0N2vCTjX.jpg',
  kaido_my:        'https://s4.anilist.co/file/anilistcdn/character/large/b63935-MkiAzBnYgqAi.jpg',
  blackbeard_ur:   'https://s4.anilist.co/file/anilistcdn/character/large/b3331-7ZJDc4BNv9Yp.jpg',
  joyboy_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b341936-l61bq77sTJBM.png',

  // ── Bleach ────────────────────────────────────────────────────
  ichigo_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  ichigo_bankai_ur:'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  ichigo_bankai:   'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  uryu_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b7-wlGHiMpTJyOe.png',
  aizen_my:        'https://s4.anilist.co/file/anilistcdn/character/large/b59-P4IUZA4bE5SL.png',
  aizen_l:         'https://s4.anilist.co/file/anilistcdn/character/large/b59-P4IUZA4bE5SL.png',
  yhwach_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b68537-1bRB5OdseCp0.jpg',

  // ── Attack on Titan ───────────────────────────────────────────
  levi_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b40219-sEXBa5pZXROm.png',

  // ── Black Clover ──────────────────────────────────────────────
  asta_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b123285-tKijiuQErDS0.png',
  asta_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b123285-tKijiuQErDS0.png',
  noelle_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b123283-7nJHtKha0LSm.png',
  yuno_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b4963-7ZMcCtXW5hkY.png',
  yami_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b124440-Lpdo6y8cljV6.png',
  licht_l:         'https://s4.anilist.co/file/anilistcdn/character/large/b141532-2AXEveTbFfPU.jpg',

  // ── Yu Yu Hakusho ─────────────────────────────────────────────
  hiei_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b732-rg4H7yyv3LRo.png',
  kurama_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b731-cv0jfjVrD09V.jpg',

  // ── Jujutsu Kaisen ────────────────────────────────────────────
  itadori_e:       'https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png',
  itadori_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png',
  sukuna_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  sukuna_fp_lt:    'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  sukuna_fp:       'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  sukuna:          'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  gojo_lt:         'https://static.wikia.nocookie.net/jujutsu-kaisen/images/a/ae/Satoru_Gojo_anime_pre_timeskip.png/revision/latest',
  gojo_e:          'https://static.wikia.nocookie.net/jujutsu-kaisen/images/a/ae/Satoru_Gojo_anime_pre_timeskip.png/revision/latest',

  // ── Demon Slayer ──────────────────────────────────────────────
  tanjiro_e:       'https://s4.anilist.co/file/anilistcdn/character/large/b127216-WV2YX8OHdvVq.png',
  tanjiro_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b127216-WV2YX8OHdvVq.png',
  muzan_my:        'https://s4.anilist.co/file/anilistcdn/character/large/b127221-KJkyCN0zMkMF.png',
  rengoku_e:       'https://s4.anilist.co/file/anilistcdn/character/large/b127220-oTrwzMlr7cPW.png',

  // ── Fullmetal Alchemist: Brotherhood ─────────────────────────
  father_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b2764-Z39q5lf5LgJi.png',
  father_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b2764-Z39q5lf5LgJi.png',

  // ── Hunter x Hunter ───────────────────────────────────────────
  gon_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b30-EjpivFaAlsWM.png',
  gon_r:           'https://s4.anilist.co/file/anilistcdn/character/large/b30-EjpivFaAlsWM.png',
  kurapika_e:      'https://s4.anilist.co/file/anilistcdn/character/large/b34-cCzjvqYijIgj.png',
  kurapika_r:      'https://s4.anilist.co/file/anilistcdn/character/large/b34-cCzjvqYijIgj.png',
  killua_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b41322-vQYmU7pnPqNe.png',
  hisoka_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b41832-OFMkuSb3uxNE.png',
  netero_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b41829-NiNjGHJbniJI.png',
  netero_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b41829-NiNjGHJbniJI.png',

  // ── Fairy Tail ────────────────────────────────────────────────
  acnologia_my:    'https://s4.anilist.co/file/anilistcdn/character/large/b63920-Qb8LuRJvTuPb.png',
  escanor_my:      'https://s4.anilist.co/file/anilistcdn/character/large/b107815-4PJPMGBpVuFk.png',
  mavis_l:         'https://s4.anilist.co/file/anilistcdn/character/large/b63917-D4lFSN7YYIZ1.png',

  // ── JoJo's Bizarre Adventure ──────────────────────────────────
  kira_my:         'https://s4.anilist.co/file/anilistcdn/character/large/b12055-eCEkIVV4qoCu.png',
  giorno_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b10529-AloL8jjZwjsg.png',
  dio_wr_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b4004-w0OtWuvjhftG.png',
  dio_l:           'https://s4.anilist.co/file/anilistcdn/character/large/b4004-w0OtWuvjhftG.png',

  // ── That Time I Got Reincarnated as a Slime ───────────────────
  rimuru_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b127022-7LqHtJa0RQMG.png',
  rimuru_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b127022-7LqHtJa0RQMG.png',

  // ── One Punch Man ─────────────────────────────────────────────
  saitama_my:      'https://s4.anilist.co/file/anilistcdn/character/large/b73935-7OlCCKJXJfyR.png',

  // ── Dragon Ball Super ─────────────────────────────────────────
  zeno_ur:         'https://s4.anilist.co/file/anilistcdn/character/large/b67753-QzWNHsalPyWu.jpg',

  // ── Sword Art Online ──────────────────────────────────────────
  asuna_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b36828-S2kOnUSJO6jZ.png',

  // ── Cowboy Bebop ──────────────────────────────────────────────
  spike_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b1-kAQO5FWbVHHi.png',

  // ── Final Fantasy VII ─────────────────────────────────────────
  cloud_r:         'https://static.wikia.nocookie.net/finalfantasy/images/e/ec/Cloud_Strife_from_FFVII_Rebirth_promo_render.png/revision/latest',
  sephiroth_e:     'https://static.wikia.nocookie.net/finalfantasy/images/a/af/Sephiroth_from_FFVII_Rebirth_promo_render.png/revision/latest',

  // ── God of War ────────────────────────────────────────────────
  kratos_my:       'https://static.wikia.nocookie.net/godofwar/images/e/e9/Kratos-_GOW_Ragnarok.png/revision/latest',
  kratos_e:        'https://static.wikia.nocookie.net/godofwar/images/e/e9/Kratos-_GOW_Ragnarok.png/revision/latest',

  // ── The Legend of Zelda ───────────────────────────────────────
  link_r:          'https://static.wikia.nocookie.net/zelda_gamepedia_en/images/4/47/TLoZ_Series_Link_Render.png/revision/latest',

  // ── Pokémon ───────────────────────────────────────────────────
  pikachu_r:       'https://img.pokemondb.net/artwork/large/pikachu.jpg',
  mewtwo_my:       'https://img.pokemondb.net/artwork/large/mewtwo.jpg',
  arceus_ur:       'https://img.pokemondb.net/artwork/large/arceus.jpg',
  ditto_lt:        'https://img.pokemondb.net/artwork/large/ditto.jpg',
  charizard:       'https://img.pokemondb.net/artwork/large/charizard.jpg',
  charizard_pk:    'https://img.pokemondb.net/artwork/large/charizard.jpg',
  gengar:          'https://img.pokemondb.net/artwork/large/gengar.jpg',
  gengar_pk:       'https://img.pokemondb.net/artwork/large/gengar.jpg',
  eevee:           'https://img.pokemondb.net/artwork/large/eevee.jpg',
  eevee_pk:        'https://img.pokemondb.net/artwork/large/eevee.jpg',
  lucario:         'https://img.pokemondb.net/artwork/large/lucario.jpg',
  lucario_mega:    'https://img.pokemondb.net/artwork/large/lucario-mega.jpg',
  rayquaza:        'https://img.pokemondb.net/artwork/large/rayquaza.jpg',
  snorlax_pk:      'https://img.pokemondb.net/artwork/large/snorlax.jpg',
  greninja_pk:     'https://img.pokemondb.net/artwork/large/greninja.jpg',

  // ── Gurren Lagann ─────────────────────────────────────────────
  simon_ur:        'https://s4.anilist.co/file/anilistcdn/character/large/b2257-jnalsdnIX1vN.jpg',
  simon_l:         'https://s4.anilist.co/file/anilistcdn/character/large/b2257-jnalsdnIX1vN.jpg',

  // ── Lookism ───────────────────────────────────────────────────
  zack_my:         'https://s4.anilist.co/file/anilistcdn/character/large/b194059-cA6HetSwYUFk.png',
  jake_kim_my:     'https://s4.anilist.co/file/anilistcdn/character/large/b194066-BNUCT5vPpIHw.png',
  samuel_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b194062-ELKqVSFBWXLm.png',
  gun_ur:          'https://s4.anilist.co/file/anilistcdn/character/large/b194065-W1k43WBR2tpF.png',
  johan_ur:        'https://s4.anilist.co/file/anilistcdn/character/large/b194064-kqIBGUv7I4p0.png',
  tom_lee_ur:      'https://s4.anilist.co/file/anilistcdn/character/large/b194067-cKaRE7I7ZfxT.png',
  daniel_park_ui_lt: 'https://static.wikia.nocookie.net/lookism/images/6/6a/Daniel_Park_UI.png/revision/latest?cb=20210820151105',

  // ── Baki ──────────────────────────────────────────────────────
  pickle_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b117083-xQjVUeZYQNpK.png',
  musashi_ur:      'https://s4.anilist.co/file/anilistcdn/character/large/b117084-d5pQOdXZL4FW.png',
  yujiro_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b20049-ZA3TDCuFfSHy.png',

  // ── Blue Lock ─────────────────────────────────────────────────
  isagi_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b140856-wVzKSyvU7R5B.png',
  bachira_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b162213-4czykzdxmWG6.png',
  chigiri_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b167444-JTHkkJAX4E3q.png',
  kunigami_r:      'https://s4.anilist.co/file/anilistcdn/character/large/b162214-9x9Q3A9rxpx8.png',
  gagamaru_r:      'https://s4.anilist.co/file/anilistcdn/character/large/b169404-90OF8t2ukD9H.jpg',
  nagi_bl_e:       'https://s4.anilist.co/file/anilistcdn/character/large/b162969-WGnGyVQrFi0X.png',
  barou_e:         'https://s4.anilist.co/file/anilistcdn/character/large/b169401-jeepvEsqW4Ns.png',
  alexis_ness_e:   'https://s4.anilist.co/file/anilistcdn/character/large/b269388-edMS5WWZzVgB.png',
  karasu_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b187524-HlZ4yDd2eGcT.png',
  zantetsu_e:      'https://s4.anilist.co/file/anilistcdn/character/large/b169406-wTagOOkC7fi5.jpg',
  rin_itoshi_l:    'https://s4.anilist.co/file/anilistcdn/character/large/b169395-7xUFV2mINMZu.png',
  sae_itoshi_l:    'https://s4.anilist.co/file/anilistcdn/character/large/b169397-wC55onsv5u8t.jpg',
  aiku_l:          'https://s4.anilist.co/file/anilistcdn/character/large/b206571-DhDhOUxff0jV.png',
  kaiser_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',
  noa_my:          'https://s4.anilist.co/file/anilistcdn/character/large/b268966-obcuMQxnKJSq.jpg',
  ego_jinpachi_my: 'https://s4.anilist.co/file/anilistcdn/character/large/b140857-DOTyKBCufon9.png',
  isagi_ego_ur:    'https://static.wikia.nocookie.net/bluelock/images/c/c0/Yoichi_Isagi_suit_anime_design.png/revision/latest?cb=20220513125325',
  kaiser_impact_lt:'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',

  // ── Hajime no Ippo ────────────────────────────────────────────
  ippo_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b15-AAj73hDX9bor.jpg',

  // ── Eromanga-sensei ───────────────────────────────────────────
  sagiri_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b89576-lw430mWycPAg.png',

  // ── Support Cards (use iconic series characters) ──────────────
  support_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
  support_e:       'https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png',
  support_l:       'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
  support_my:      'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
  support_ur:      'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',

  // ── Weapon Cards ─────────────────────────────────────────────
  madara_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
  itachi_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
  kaguya_weapon:        'https://static.wikia.nocookie.net/naruto/images/6/6c/Kaguya_%C5%8Ctsutsuki.png/revision/latest',
  sage_naruto_weapon:   'https://static.wikia.nocookie.net/naruto/images/e/e9/Six_Paths_Sage_Mode_Naruto.png/revision/latest',
  shanks_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
  whitebeard_weapon:    'https://s4.anilist.co/file/anilistcdn/character/large/b2751-NnzW0N2vCTjX.jpg',
  kaido_weapon:         'https://s4.anilist.co/file/anilistcdn/character/large/b63935-MkiAzBnYgqAi.jpg',
  blackbeard_weapon:    'https://s4.anilist.co/file/anilistcdn/character/large/b3331-7ZJDc4BNv9Yp.jpg',
  joyboy_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b341936-l61bq77sTJBM.png',
  gear5_luffy_weapon:   'https://static.wikia.nocookie.net/onepiece/images/0/06/Nika_Anime_Infobox.png/revision/latest?cb=20240407020958',
  aizen_weapon:         'https://s4.anilist.co/file/anilistcdn/character/large/b59-P4IUZA4bE5SL.png',
  ichigo_bankai_weapon: 'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  yhwach_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b68537-1bRB5OdseCp0.jpg',
  father_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b2764-Z39q5lf5LgJi.png',
  netero_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b41829-NiNjGHJbniJI.png',
  kratos_weapon:        'https://static.wikia.nocookie.net/godofwar/images/e/e9/Kratos-_GOW_Ragnarok.png/revision/latest',
  kira_weapon:          'https://s4.anilist.co/file/anilistcdn/character/large/b12055-eCEkIVV4qoCu.png',
  giorno_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b10529-AloL8jjZwjsg.png',
  dio_wr_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b4004-w0OtWuvjhftG.png',
  muzan_weapon:         'https://s4.anilist.co/file/anilistcdn/character/large/b127221-KJkyCN0zMkMF.png',
  sukuna_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  sukuna_fp_weapon:     'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  gojo_weapon:          'https://static.wikia.nocookie.net/jujutsu-kaisen/images/a/ae/Satoru_Gojo_anime_pre_timeskip.png/revision/latest',
  acnologia_weapon:     'https://s4.anilist.co/file/anilistcdn/character/large/b63920-Qb8LuRJvTuPb.png',
  escanor_weapon:       'https://s4.anilist.co/file/anilistcdn/character/large/b107815-4PJPMGBpVuFk.png',
  simon_weapon:         'https://s4.anilist.co/file/anilistcdn/character/large/b2257-jnalsdnIX1vN.jpg',
  rimuru_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b127022-7LqHtJa0RQMG.png',
  beerus_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b76348-pGWrznfxgPIV.png',
  zeno_weapon:          'https://s4.anilist.co/file/anilistcdn/character/large/b67753-QzWNHsalPyWu.jpg',
  ultra_goku_weapon:    'https://static.wikia.nocookie.net/dragonball/images/b/b9/Ultra_Instinct_Goku.png/revision/latest?cb=20180930060236',
  saitama_weapon:       'https://s4.anilist.co/file/anilistcdn/character/large/b73935-7OlCCKJXJfyR.png',
  mewtwo_weapon:        'https://img.pokemondb.net/artwork/large/mewtwo.jpg',
  arceus_weapon:        'https://img.pokemondb.net/artwork/large/arceus.jpg',
  ditto_lt_weapon:      'https://img.pokemondb.net/artwork/large/ditto.jpg',
  daniel_weapon:        'https://static.wikia.nocookie.net/lookism/images/6/6a/Daniel_Park_UI.png/revision/latest?cb=20210820151105',
  daniel_park_ui_lt_weapon: 'https://static.wikia.nocookie.net/lookism/images/6/6a/Daniel_Park_UI.png/revision/latest?cb=20210820151105',
  zack_weapon:          'https://s4.anilist.co/file/anilistcdn/character/large/b194059-cA6HetSwYUFk.png',
  jake_kim_weapon:      'https://s4.anilist.co/file/anilistcdn/character/large/b194066-BNUCT5vPpIHw.png',
  samuel_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b194062-ELKqVSFBWXLm.png',
  gun_weapon:           'https://s4.anilist.co/file/anilistcdn/character/large/b194065-W1k43WBR2tpF.png',
  johan_weapon:         'https://s4.anilist.co/file/anilistcdn/character/large/b194064-kqIBGUv7I4p0.png',
  tom_lee_weapon:       'https://s4.anilist.co/file/anilistcdn/character/large/b194067-cKaRE7I7ZfxT.png',
  pickle_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b117083-xQjVUeZYQNpK.png',
  musashi_weapon:       'https://s4.anilist.co/file/anilistcdn/character/large/b117084-d5pQOdXZL4FW.png',
  yujiro_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b20049-ZA3TDCuFfSHy.png',
  isagi_ego_weapon:     'https://static.wikia.nocookie.net/bluelock/images/c/c0/Yoichi_Isagi_suit_anime_design.png/revision/latest?cb=20220513125325',
  kaiser_weapon:        'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',
  kaiser_impact_weapon: 'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',
  noa_weapon:           'https://s4.anilist.co/file/anilistcdn/character/large/b268966-obcuMQxnKJSq.jpg',
  ego_jinpachi_weapon:  'https://s4.anilist.co/file/anilistcdn/character/large/b140857-DOTyKBCufon9.png',

  // ── Plain card-ID aliases (no rarity suffix) ─────────────────
  // Naruto
  naruto:          'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
  sasuke:          'https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png',
  itachi:          'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
  madara:          'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
  kaguya:          'https://static.wikia.nocookie.net/naruto/images/6/6c/Kaguya_%C5%8Ctsutsuki.png/revision/latest',
  sakura:          'https://s4.anilist.co/file/anilistcdn/character/large/b145-IorfpI8arxeX.png',
  // Dragon Ball
  goku:            'https://s4.anilist.co/file/anilistcdn/character/large/b246-wsRRr6z1kii8.png',
  vegeta:          'https://s4.anilist.co/file/anilistcdn/character/large/b913-NIFkKazWM8VO.png',
  beerus:          'https://s4.anilist.co/file/anilistcdn/character/large/b76348-pGWrznfxgPIV.png',
  zeno:            'https://s4.anilist.co/file/anilistcdn/character/large/b67753-QzWNHsalPyWu.jpg',
  ultra_goku:      'https://static.wikia.nocookie.net/dragonball/images/b/b9/Ultra_Instinct_Goku.png/revision/latest?cb=20180930060236',
  // One Piece
  luffy:           'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png',
  zoro:            'https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png',
  nami:            'https://s4.anilist.co/file/anilistcdn/character/large/b723-vp5hPptgnNEC.png',
  usopp:           'https://s4.anilist.co/file/anilistcdn/character/large/b724-GFGgI9AJQkfy.jpg',
  chopper:         'https://s4.anilist.co/file/anilistcdn/character/large/b309-H64NhbJ2ywIQ.jpg',
  sanji:           'https://s4.anilist.co/file/anilistcdn/character/large/b305-6lisPmHtCnLT.png',
  robin:           'https://s4.anilist.co/file/anilistcdn/character/large/b61-ywXUyyocEEqt.png',
  ace:             'https://s4.anilist.co/file/anilistcdn/character/large/b2072-Lc6jEdsueJUK.jpg',
  law:             'https://s4.anilist.co/file/anilistcdn/character/large/b13767-U604OJN9dxCn.jpg',
  kid:             'https://s4.anilist.co/file/anilistcdn/character/large/b14989-uykLqnBTdAc2.jpg',
  shanks:          'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
  mihawk:          'https://s4.anilist.co/file/anilistcdn/character/large/n2064-OpnF4nLi6bvL.png',
  whitebeard:      'https://s4.anilist.co/file/anilistcdn/character/large/b2751-NnzW0N2vCTjX.jpg',
  kaido:           'https://s4.anilist.co/file/anilistcdn/character/large/b63935-MkiAzBnYgqAi.jpg',
  blackbeard:      'https://s4.anilist.co/file/anilistcdn/character/large/b3331-7ZJDc4BNv9Yp.jpg',
  joyboy:          'https://s4.anilist.co/file/anilistcdn/character/large/b341936-l61bq77sTJBM.png',
  gear5_luffy:     'https://static.wikia.nocookie.net/onepiece/images/0/06/Nika_Anime_Infobox.png/revision/latest?cb=20240407020958',
  // Bleach
  ichigo:          'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  ichigo_bankai:   'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  uryu:            'https://s4.anilist.co/file/anilistcdn/character/large/b7-wlGHiMpTJyOe.png',
  aizen:           'https://s4.anilist.co/file/anilistcdn/character/large/b59-P4IUZA4bE5SL.png',
  yhwach:          'https://s4.anilist.co/file/anilistcdn/character/large/b68537-1bRB5OdseCp0.jpg',
  // Attack on Titan
  levi:            'https://s4.anilist.co/file/anilistcdn/character/large/b40219-sEXBa5pZXROm.png',
  // Jujutsu Kaisen
  itadori:         'https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png',
  sukuna:          'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  sukuna_fp:       'https://s4.anilist.co/file/anilistcdn/character/large/b127213-KwPAqT1Mvqk6.png',
  gojo:            'https://static.wikia.nocookie.net/jujutsu-kaisen/images/a/ae/Satoru_Gojo_anime_pre_timeskip.png/revision/latest',
  // Demon Slayer
  tanjiro:         'https://s4.anilist.co/file/anilistcdn/character/large/b127216-WV2YX8OHdvVq.png',
  muzan:           'https://s4.anilist.co/file/anilistcdn/character/large/b127221-KJkyCN0zMkMF.png',
  rengoku:         'https://s4.anilist.co/file/anilistcdn/character/large/b127220-oTrwzMlr7cPW.png',
  // Black Clover
  asta:            'https://s4.anilist.co/file/anilistcdn/character/large/b123285-tKijiuQErDS0.png',
  noelle:          'https://s4.anilist.co/file/anilistcdn/character/large/b123283-7nJHtKha0LSm.png',
  yuno:            'https://s4.anilist.co/file/anilistcdn/character/large/b4963-7ZMcCtXW5hkY.png',
  yami:            'https://s4.anilist.co/file/anilistcdn/character/large/b124440-Lpdo6y8cljV6.png',
  licht:           'https://s4.anilist.co/file/anilistcdn/character/large/b141532-2AXEveTbFfPU.jpg',
  // Yu Yu Hakusho
  hiei:            'https://s4.anilist.co/file/anilistcdn/character/large/b732-rg4H7yyv3LRo.png',
  kurama:          'https://s4.anilist.co/file/anilistcdn/character/large/b731-cv0jfjVrD09V.jpg',
  // Fairy Tail
  acnologia:       'https://s4.anilist.co/file/anilistcdn/character/large/b63920-Qb8LuRJvTuPb.png',
  escanor:         'https://s4.anilist.co/file/anilistcdn/character/large/b107815-4PJPMGBpVuFk.png',
  mavis:           'https://s4.anilist.co/file/anilistcdn/character/large/b63917-D4lFSN7YYIZ1.png',
  // JoJo's Bizarre Adventure
  kira:            'https://s4.anilist.co/file/anilistcdn/character/large/b12055-eCEkIVV4qoCu.png',
  giorno:          'https://s4.anilist.co/file/anilistcdn/character/large/b10529-AloL8jjZwjsg.png',
  dio_wr:          'https://s4.anilist.co/file/anilistcdn/character/large/b4004-w0OtWuvjhftG.png',
  // That Time I Got Reincarnated as a Slime
  rimuru:          'https://s4.anilist.co/file/anilistcdn/character/large/b127022-7LqHtJa0RQMG.png',
  // One Punch Man
  saitama:         'https://s4.anilist.co/file/anilistcdn/character/large/b73935-7OlCCKJXJfyR.png',
  // Pokémon
  pikachu:         'https://img.pokemondb.net/artwork/large/pikachu.jpg',
  mewtwo:          'https://img.pokemondb.net/artwork/large/mewtwo.jpg',
  arceus:          'https://img.pokemondb.net/artwork/large/arceus.jpg',
  ditto:           'https://img.pokemondb.net/artwork/large/ditto.jpg',
  // Sword Art Online
  asuna:           'https://s4.anilist.co/file/anilistcdn/character/large/b36828-S2kOnUSJO6jZ.png',
  // Cowboy Bebop
  spike:           'https://s4.anilist.co/file/anilistcdn/character/large/b1-kAQO5FWbVHHi.png',
  // God of War
  kratos:          'https://static.wikia.nocookie.net/godofwar/images/e/e9/Kratos-_GOW_Ragnarok.png/revision/latest',
  // Final Fantasy VII
  cloud:           'https://static.wikia.nocookie.net/finalfantasy/images/e/ec/Cloud_Strife_from_FFVII_Rebirth_promo_render.png/revision/latest',
  sephiroth:       'https://static.wikia.nocookie.net/finalfantasy/images/a/af/Sephiroth_from_FFVII_Rebirth_promo_render.png/revision/latest',
  // The Legend of Zelda
  link:            'https://static.wikia.nocookie.net/zelda_gamepedia_en/images/4/47/TLoZ_Series_Link_Render.png/revision/latest',
  // Hunter x Hunter
  killua:          'https://s4.anilist.co/file/anilistcdn/character/large/b41322-vQYmU7pnPqNe.png',
  gon:             'https://s4.anilist.co/file/anilistcdn/character/large/b30-EjpivFaAlsWM.png',
  kurapika:        'https://s4.anilist.co/file/anilistcdn/character/large/b34-cCzjvqYijIgj.png',
  hisoka:          'https://s4.anilist.co/file/anilistcdn/character/large/b41832-OFMkuSb3uxNE.png',
  netero:          'https://s4.anilist.co/file/anilistcdn/character/large/b41829-NiNjGHJbniJI.png',
  // Gurren Lagann
  simon:           'https://s4.anilist.co/file/anilistcdn/character/large/b2257-jnalsdnIX1vN.jpg',
  // Lookism
  zack:            'https://s4.anilist.co/file/anilistcdn/character/large/b194059-cA6HetSwYUFk.png',
  jake_kim:        'https://s4.anilist.co/file/anilistcdn/character/large/b194066-BNUCT5vPpIHw.png',
  samuel:          'https://s4.anilist.co/file/anilistcdn/character/large/b194062-ELKqVSFBWXLm.png',
  gun:             'https://s4.anilist.co/file/anilistcdn/character/large/b194065-W1k43WBR2tpF.png',
  johan:           'https://s4.anilist.co/file/anilistcdn/character/large/b194064-kqIBGUv7I4p0.png',
  tom_lee:         'https://s4.anilist.co/file/anilistcdn/character/large/b194067-cKaRE7I7ZfxT.png',
  // Baki
  pickle:          'https://s4.anilist.co/file/anilistcdn/character/large/b117083-xQjVUeZYQNpK.png',
  musashi:         'https://s4.anilist.co/file/anilistcdn/character/large/b117084-d5pQOdXZL4FW.png',
  yujiro:          'https://s4.anilist.co/file/anilistcdn/character/large/b20049-ZA3TDCuFfSHy.png',
  // Blue Lock
  isagi:           'https://s4.anilist.co/file/anilistcdn/character/large/b140856-wVzKSyvU7R5B.png',
  bachira:         'https://s4.anilist.co/file/anilistcdn/character/large/b162213-4czykzdxmWG6.png',
  chigiri:         'https://s4.anilist.co/file/anilistcdn/character/large/b167444-JTHkkJAX4E3q.png',
  kunigami:        'https://s4.anilist.co/file/anilistcdn/character/large/b162214-9x9Q3A9rxpx8.png',
  gagamaru:        'https://s4.anilist.co/file/anilistcdn/character/large/b169404-90OF8t2ukD9H.jpg',
  nagi_bl:         'https://s4.anilist.co/file/anilistcdn/character/large/b162969-WGnGyVQrFi0X.png',
  barou:           'https://s4.anilist.co/file/anilistcdn/character/large/b169401-jeepvEsqW4Ns.png',
  alexis_ness:     'https://s4.anilist.co/file/anilistcdn/character/large/b269388-edMS5WWZzVgB.png',
  karasu:          'https://s4.anilist.co/file/anilistcdn/character/large/b187524-HlZ4yDd2eGcT.png',
  zantetsu:        'https://s4.anilist.co/file/anilistcdn/character/large/b169406-wTagOOkC7fi5.jpg',
  rin_itoshi:      'https://s4.anilist.co/file/anilistcdn/character/large/b169395-7xUFV2mINMZu.png',
  sae_itoshi:      'https://s4.anilist.co/file/anilistcdn/character/large/b169397-wC55onsv5u8t.jpg',
  aiku:            'https://s4.anilist.co/file/anilistcdn/character/large/b206571-DhDhOUxff0jV.png',
  shidou:          'https://s4.anilist.co/file/anilistcdn/character/large/b187523-oiRzrqpNvujF.png',
  hiori:           'https://s4.anilist.co/file/anilistcdn/character/large/b206574-e87BUKVRPtAL.png',
  kaiser:          'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',
  noa:             'https://s4.anilist.co/file/anilistcdn/character/large/b268966-obcuMQxnKJSq.jpg',
  ego_jinpachi:    'https://s4.anilist.co/file/anilistcdn/character/large/b140857-DOTyKBCufon9.png',
  isagi_ego:       'https://static.wikia.nocookie.net/bluelock/images/c/c0/Yoichi_Isagi_suit_anime_design.png/revision/latest?cb=20220513125325',
  kaiser_impact:   'https://s4.anilist.co/file/anilistcdn/character/large/b268963-0i8SgRcs6ibf.png',
  // Death Note
  near:            'https://s4.anilist.co/file/anilistcdn/character/large/b77-9L68YV3Y0nJ3.png',
  // Misc
  ippo:            'https://s4.anilist.co/file/anilistcdn/character/large/b15-AAj73hDX9bor.jpg',
  sagiri:          'https://s4.anilist.co/file/anilistcdn/character/large/b89576-lw430mWycPAg.png',
};

// ── AniList character IDs and search terms for remaining cards ─
// Numeric values = direct AniList character ID lookup (guaranteed correct).
// String values  = name search (only for chars without a known AniList ID).
// Use specific, fully-qualified names to avoid ambiguous matches.
const SEARCH_TERMS = {
  // ── Bleach secondary cast (direct AniList character IDs) ──────
  rukia_r:      6,    rukia:        6,    // Rukia Kuchiki
  byakuya_e:    4,    byakuya:      4,    // Byakuya Kuchiki
  renji_r:      8,    renji:        8,    // Renji Abarai
  gin_l:        9,    gin:          9,    // Gin Ichimaru
  orihime_r:    10,   orihime:      10,   // Orihime Inoue
  chad_r:       11,   chad:         11,   // Yasutora Sado
  grimmjow_e:   20,   grimmjow:     20,   // Grimmjow Jaegerjaquez
  ulquiorra_e:  22,   ulquiorra:    22,   // Ulquiorra Cifer
  yhwach_my:    68537, yhwach_ur:   68537, // Yhwach (already in seed too)

  // ── JoJo's Bizarre Adventure (direct AniList IDs) ─────────────
  jotaro_e:    10755,  jotaro:     10755,  // Jotaro Kujo
  joseph_r:    13041,  joseph:     13041,  // Joseph Joestar
  noriaki_r:   12053,  noriaki:    12053,  // Noriaki Kakyoin
  josuke_e:    10766,  josuke:     10766,  // Josuke Higashikata (Part 4)
  caesar_r:    12052,  caesar:     12052,  // Caesar Zeppeli
  dio_l:       4004,   dio:        4004,   // DIO (shared with dio_wr)

  // ── My Hero Academia (direct AniList IDs) ─────────────────────
  deku_e:      83595,  deku:       83595,  // Izuku Midoriya
  deku_r:      83595,
  bakugo_e:    83794,  bakugo:     83794,  // Katsuki Bakugo
  allmight_l:  83796,  allmight:   83796,  // All Might

  // ── Attack on Titan (direct AniList ID) ───────────────────────
  eren_e:      40229,  eren:       40229,  // Eren Yeager

  // ── Demon Slayer (sequential after Tanjiro=127216) ─────────────
  nezuko_r:    127217, nezuko:     127217, // Nezuko Kamado
  zenitsu_r:   127218, zenitsu:   127218, // Zenitsu Agatsuma
  inosuke_r:   127219, inosuke:   127219, // Inosuke Hashibira
  tengen_e:    127220, tengen:    127220,  // Tengen Uzui

  // ── Fullmetal Alchemist: Brotherhood (direct AniList IDs) ─────
  edward_e:    11,     edward:     11,     // Edward Elric
  edward_r:    11,
  alphonse_r:  12,     alphonse:   12,     // Alphonse Elric
  winry_r:     13,     winry:      13,     // Winry Rockbell
  roy_e:       37,     roy:        37,     // Roy Mustang
  armstrong_e: 39,     armstrong:  39,     // Alex Louis Armstrong
  father:      'Father Fullmetal Alchemist', // Father (Homunculus)

  // ── Jujutsu Kaisen ────────────────────────────────────────────
  nobara_r:    127215, nobara:    127215,  // Nobara Kugisaki
  todo_e:      127214, todo:      127214,  // Aoi Todo
  yuta_l:      171,    yuta:      171,     // Yuta Okkotsu

  // ── Fairy Tail (direct AniList IDs) ───────────────────────────
  natsu_e:     114,    natsu:      114,    // Natsu Dragneel
  natsu_r:     114,
  gray_r:      115,    gray:       115,    // Gray Fullbuster
  erza_e:      116,    erza:       116,    // Erza Scarlet
  erza_r:      116,
  laxus_e:     2553,   laxus:      2553,   // Laxus Dreyar
  gildarts_e:  2554,   gildarts:   2554,   // Gildarts Clive

  // ── Death Note (direct AniList IDs) ───────────────────────────
  light_l:     80,     light:      80,     // Light Yagami
  l_l:         71,     l:          71,     // L Lawliet
  near_l:      77,

  // ── Mob Psycho 100 (direct AniList IDs) ───────────────────────
  mob_l:       121516, mob:       121516,  // Shigeo Kageyama (Mob)
  reigen_r:    121515, reigen:    121515,  // Reigen Arataka

  // ── Chainsaw Man (direct AniList IDs) ─────────────────────────
  denji_e:     156918, denji:     156918,  // Denji
  makima_e:    156919, makima:    156919,  // Makima
  power:       'Power Chainsaw Man',       // Power (Blood Fiend)

  // ── Spy x Family (direct AniList IDs) ────────────────────────
  loid_r:      172117, loid:      172117,  // Loid Forger
  yor_r:       172118, yor:       172118,  // Yor Forger
  anya_r:      172119, anya:      172119,  // Anya Forger

  // ── Re:Zero (direct AniList IDs) ─────────────────────────────
  subaru_r:    109855, subaru:    109855,  // Subaru Natsuki
  emilia_r:    109856, emilia:    109856,  // Emilia
  rem_e:       109863, rem:       109863,  // Rem

  // ── Gintama ───────────────────────────────────────────────────
  gintoki_e:   850,    gintoki:   850,     // Gintoki Sakata
  gintoki_r:   850,

  // ── Inuyasha ──────────────────────────────────────────────────
  inuyasha_r:  8340,   inuyasha:  8340,   // Inuyasha

  // ── Steins;Gate ───────────────────────────────────────────────
  okabe_r:     24835,  okabe:     24835,  // Rintaro Okabe

  // ── Yu Yu Hakusho (direct AniList IDs) ───────────────────────
  yusuke_e:    733,    yusuke:    733,    // Yusuke Urameshi
  yusuke_r:    733,

  // ── Overlord (direct AniList ID) ─────────────────────────────
  albedo_e:    95027,  albedo:    95027,  // Albedo

  // ── Black Clover ─────────────────────────────────────────────
  julius_e:    124443, julius:   124443,  // Julius Novachrono

  // ── One Punch Man ─────────────────────────────────────────────
  genos_l:     73936,  genos:    73936,   // Genos

  // ── Seven Deadly Sins (direct AniList IDs) ────────────────────
  ban_e:       107808, ban:      107808,  // Ban
  escanor_my:  107815, escanor:  107815,  // Escanor (also in SEED plain aliases)

  // ── Vinland Saga (direct AniList IDs) ────────────────────────
  thorfinn_e:  156810, thorfinn: 156810,  // Thorfinn
  askeladd_e:  156811, askeladd: 156811,  // Askeladd

  // ── Code Geass (direct AniList ID) ───────────────────────────
  lelouch_e:   417,    lelouch:  417,     // Lelouch vi Britannia

  // ── Gurren Lagann (direct AniList ID) ────────────────────────
  kamina_e:    2255,   kamina:   2255,    // Kamina (Simon=2257, so Kamina=2255)

  // ── Black Butler (direct AniList ID) ─────────────────────────
  sebastian_e: 1036,   sebastian: 1036,   // Sebastian Michaelis

  // ── Sword Art Online ─────────────────────────────────────────
  kirito_r:    36827,  kirito:   36827,   // Kirito (Kazuto Kirigaya)

  // ── Lookism (direct AniList IDs) ─────────────────────────────
  daniel_my:   194055, daniel:   194055,  // Daniel Park
  daniel_park_ui_lt: 194055,
  jay_e:       194058, jay:      194058,  // Jay Hong
  vasco_l:     194060, vasco:    194060,  // Vasco
  crystal_e:   194057, crystal:  194057,  // Crystal Choi
  eli_l:       194063, eli:      194063,  // Eli Jang

  // ── Baki (direct AniList IDs) ─────────────────────────────────
  baki_e:      117081, baki:     117081,  // Baki Hanma
  hanayama_e:  117082, hanayama: 117082,  // Kaoru Hanayama
  doppo_e:     117085, doppo:    117085,  // Doppo Orochi
  retsu_e:     117086, retsu:    117086,  // Retsu Kaioh
  jack_e:      117087, jack:     117087,  // Jack Hanma
  oliva_l:     117088, oliva:    117088,  // Biscuit Oliva
  shibukawa_l: 117089, shibukawa:117089,  // Goki Shibukawa

  // ── Naruto additional cast ────────────────────────────────────
  rock_lee:         19,     hinata:          'Hinata Hyuga Naruto',
  kakashi:          'Kakashi Hatake Naruto',
  shikamaru:        18,     gaara:           21,
  neji:             20,     temari:          22,
  might_guy:        24,     kiba:            'Kiba Inuzuka Naruto',
  tenten:           'Tenten Naruto',   ino:         'Ino Yamanaka Naruto',
  minato:           'Minato Namikaze Naruto',
  jiraiya:          'Jiraiya Naruto',  tsunade:     'Tsunade Naruto',
  orochimaru:       'Orochimaru Naruto',
  pain_nbr:         'Nagato Naruto',   obito_uchiha:'Obito Uchiha Naruto',
  kabuto_yakushi:   'Kabuto Yakushi Naruto',
  asuma_sarutobi:   'Asuma Sarutobi Naruto',
  kurenai_yuhi:     'Kurenai Yuhi Naruto',
  anko_mitarashi:   'Anko Mitarashi Naruto',
  iruka_umino:      'Iruka Umino Naruto',
  kisame_hoshigaki: 'Kisame Hoshigaki Naruto',
  deidara_akatsuki: 'Deidara Naruto',  konan_akatsuki:'Konan Naruto',
  sasori_akatsuki:  'Sasori Naruto',   hidan_akatsuki:'Hidan Naruto',
  kakuzu_akatsuki:  'Kakuzu Naruto',   danzo_naruto:  'Danzo Shimura Naruto',
  hiruzen_naruto:   'Hiruzen Sarutobi Naruto',
  tobirama_naruto:  'Tobirama Senju Naruto',
  nagato_naruto:    'Nagato Naruto',   fu_naruto:     'Fu Naruto',
  torune_naruto:    'Torune Naruto',   kimimaro_naruto:'Kimimaro Naruto',
  hashirama:        'Hashirama Senju Naruto',
  minato_kunai:     'Minato Namikaze Naruto',
  hashirama_ult:    'Hashirama Senju Naruto',
  kaguya_ultra:     'Kaguya Otsutsuki Naruto',
  naruto_kurama:    17,
  sasuke_rinnegan:  13,

  // ── Dragon Ball additional cast ───────────────────────────────
  krillin:          'Krillin Dragon Ball',
  gohan_dbz:        'Gohan Dragon Ball',
  trunks_dbz:       'Trunks Dragon Ball',
  piccolo_dbz:      'Piccolo Dragon Ball',
  android18:        'Android 18 Dragon Ball',
  frieza_dbz:       'Frieza Dragon Ball',
  cell_dbz:         'Cell Dragon Ball',
  broly_dbz:        'Broly Dragon Ball',
  gogeta_dbs:       'Gogeta Dragon Ball',
  buu_dbz:          'Majin Buu Dragon Ball',
  janemba_dbz:      'Janemba Dragon Ball',
  baby_dbz:         'Baby Dragon Ball GT',
  omega_shenron:    'Omega Shenron Dragon Ball GT',
  super_17_dbz:     'Super 17 Dragon Ball GT',
  cooler_dbz:       'Cooler Dragon Ball',
  turles_dbz:       'Turles Dragon Ball',
  pan_dbz:          'Pan Dragon Ball',
  uub_dbz:          'Uub Dragon Ball',
  raditz_dbz:       'Raditz Dragon Ball',
  nappa_dbz:        'Nappa Dragon Ball',
  hit_dbs:          'Hit Dragon Ball Super',
  gt_goku_ssj4:     'Goku SSJ4 Dragon Ball GT',
  android17_dbz:    'Android 17 Dragon Ball',
  videl_dbz:        'Videl Dragon Ball',
  bardock_dbz:      'Bardock Dragon Ball',
  toppo_dbs:        'Toppo Dragon Ball Super',
  dyspo_dbs:        'Dyspo Dragon Ball Super',
  paragus_dbz:      'Paragus Dragon Ball',
  jiren:            'Jiren Dragon Ball Super',
  whis:             'Whis Dragon Ball Super',
  goky_ui_omen:     246,
  gohan_beast:      'Gohan Dragon Ball Super',
  broly_canon:      'Broly Dragon Ball Super',
  granolah_dbs:     'Granolah Dragon Ball Super',
  gas_dbs:          'Gas Dragon Ball Super',
  vegito:           'Vegito Dragon Ball',
  hagoromo:         'Hagoromo Otsutsuki Naruto',

  // ── One Piece additional cast ─────────────────────────────────
  franky:           'Franky One Piece',  brook:        'Brook One Piece',
  jinbe:            'Jinbe One Piece',   vivi:         'Nefertari Vivi One Piece',
  crocodile_op:     'Crocodile One Piece', enel_op:    'Enel One Piece',
  rob_lucci_op:     'Rob Lucci One Piece', smoker_op:  'Smoker One Piece',
  perona_op:        'Perona One Piece',  bartolomeo_op:'Bartolomeo One Piece',
  cavendish_op:     'Cavendish One Piece', coby_op:   'Koby One Piece',
  fujitora_op:      'Fujitora One Piece', sengoku_op: 'Sengoku One Piece',
  buggy_op:         'Buggy One Piece',   monet_op:    'Monet One Piece',
  sugar_op:         'Sugar One Piece',   caesar_op:   'Caesar Clown One Piece',
  vergo_op:         'Vergo One Piece',   pica_op:     'Pica One Piece',
  trebol_op:        'Trebol One Piece',  brulee_op:   'Brulee One Piece',
  pudding_op:       'Charlotte Pudding One Piece',
  carrot_op:        'Carrot One Piece',  doflamingo:  'Doflamingo One Piece',
  katakuri:         'Charlotte Katakuri One Piece',
  boa_hancock:      'Boa Hancock One Piece',
  gol_d_roger:      'Gol D Roger One Piece',
  silvers_rayleigh: 'Silvers Rayleigh One Piece',
  monkey_d_garp:    'Monkey D Garp One Piece',
  monkey_d_dragon:  'Monkey D Dragon One Piece',
  luffy_gear5:      40,
  kaido_ult:        63935,  big_mom_op:  'Big Mom One Piece',
  aokiji_op:        'Aokiji One Piece',  kizaru_op:   'Kizaru One Piece',
  akainu_op:        'Akainu One Piece',  law_op:      13767,
  kid_op:           14989,  zoro_enma:   62,
  nami_op:          723,    usopp_op:    724,
  roger_conqueror:  'Gol D Roger One Piece',

  // ── Bleach additional cast ────────────────────────────────────
  toshiro:          'Toshiro Hitsugaya Bleach',
  rangiku:          'Rangiku Matsumoto Bleach',
  shunsui:          'Shunsui Kyoraku Bleach',
  kenpachi:         'Kenpachi Zaraki Bleach',
  shinji_bl:        'Shinji Hirako Bleach',
  kisuke:           'Kisuke Urahara Bleach',
  unohana:          'Retsu Unohana Bleach',
  mayuri_bl:        'Mayuri Kurotsuchi Bleach',
  yamamoto:         'Genryusai Yamamoto Bleach',
  barragan:         'Barragan Louisenbairn Bleach',
  harribel_bl:      'Tier Harribel Bleach',
  starrk_bl:        'Coyote Starrk Bleach',
  nnoitora_bl:      'Nnoitora Gilga Bleach',
  szayelaporro_bl:  'Szayelaporro Grantz Bleach',
  lille_barro_bl:   'Lille Barro Bleach',
  pernida_bl:       'Pernida Parnkgjas Bleach',
  gerard_bl:        'Gerard Valkyrie Bleach',
  as_nodt_bl:       'As Nodt Bleach',
  bazz_b_bl:        'Bazz-B Bleach',
  haschwalth_bl:    'Jugram Haschwalth Bleach',
  gremmy_bl:        'Gremmy Thoumeaux Bleach',
  nanao_bl:         'Nanao Ise Bleach',
  nemu_bl:          'Nemu Kurotsuchi Bleach',
  izuru_kira_bl:    'Izuru Kira Bleach',
  momo_hinamori_bl: 'Momo Hinamori Bleach',

  // ── My Hero Academia additional cast ─────────────────────────
  todoroki:         83798,  uraraka:         83799,
  kirishima:        'Eijiro Kirishima My Hero Academia',
  tokoyami:         'Fumikage Tokoyami My Hero Academia',
  yaoyorozu:        'Momo Yaoyorozu My Hero Academia',
  tenya_iida:       'Tenya Iida My Hero Academia',
  hawks_mha:        'Hawks My Hero Academia',
  endeavor_mha:     'Endeavor My Hero Academia',
  twice_mha:        'Twice My Hero Academia',
  toga_mha:         'Himiko Toga My Hero Academia',
  shigaraki:        'Tomura Shigaraki My Hero Academia',
  dabi:             'Dabi My Hero Academia',
  all_for_one:      'All For One My Hero Academia',
  nejire_hado_mha:  'Nejire Hado My Hero Academia',
  tamaki_amajiki_mha:'Tamaki Amajiki My Hero Academia',
  mirio_togata_mha: 'Mirio Togata My Hero Academia',
  sir_nighteye_mha: 'Sir Nighteye My Hero Academia',
  mirko_mha:        'Mirko My Hero Academia',
  aizawa_mha:       'Aizawa My Hero Academia',
  present_mic_mha:  'Present Mic My Hero Academia',
  froppy_mha:       'Tsuyu Asui My Hero Academia',
  mineta_mha:       'Minoru Mineta My Hero Academia',
  shinso_mha:       'Hitoshi Shinso My Hero Academia',
  hpresent_mic_mha: 'Present Mic My Hero Academia',
  fat_gum_mha:      'Fat Gum My Hero Academia',
  best_jeanist_mha: 'Best Jeanist My Hero Academia',
  gang_orca_mha:    'Gang Orca My Hero Academia',
  monoma_mha:       'Neito Monoma My Hero Academia',

  // ── Demon Slayer additional cast ─────────────────────────────
  shinobu:          127223, kanao:           127224,
  genya:            'Genya Shinazugawa Demon Slayer',
  gyomei:           'Gyomei Himejima Demon Slayer',
  muichiro:         'Muichiro Tokito Demon Slayer',
  sanemi:           'Sanemi Shinazugawa Demon Slayer',
  mitsuri:          'Mitsuri Kanroji Demon Slayer',
  yoriichi:         'Yoriichi Tsugikuni Demon Slayer',
  yoriichi_lt:      'Yoriichi Tsugikuni Demon Slayer',
  kokushibo:        'Kokushibo Demon Slayer',
  douma_ds:         'Douma Demon Slayer',
  akaza_ds:         'Akaza Demon Slayer',
  hantengu_ds:      'Hantengu Demon Slayer',
  gyokko_ds:        'Gyokko Demon Slayer',
  daki_ds:          'Daki Demon Slayer',
  gyutaro_ds:       'Gyutaro Demon Slayer',
  nakime_ds:        'Nakime Demon Slayer',
  enmu_ds:          'Enmu Demon Slayer',
  zohakuten_ds:     'Zohakuten Demon Slayer',
  kagaya_ds:        'Kagaya Ubuyashiki Demon Slayer',
  hotaru_ds:        'Hotaru Haganezuka Demon Slayer',
  zenitsu_pillar:   127218, inosuke_beast:   127219,
  kanao_flower:     127224,
  wind_hashira:     'Sanemi Shinazugawa Demon Slayer',

  // ── Jujutsu Kaisen additional cast ───────────────────────────
  megumi:           127211, maki:            127222,
  inumaki:          'Toge Inumaki Jujutsu Kaisen',
  nanami:           'Kento Nanami Jujutsu Kaisen',
  choso:            'Choso Jujutsu Kaisen',
  mahito:           'Mahito Jujutsu Kaisen',
  jogo_jjk:         'Jogo Jujutsu Kaisen',
  kenjaku:          'Kenjaku Jujutsu Kaisen',
  hakari_jjk:       'Kinji Hakari Jujutsu Kaisen',
  higuruma_jjk:     'Hiromi Higuruma Jujutsu Kaisen',
  hana_kurusu_jjk:  'Hana Kurusu Jujutsu Kaisen',
  kamo_jjk:         'Noritoshi Kamo Jujutsu Kaisen',
  naobito_jjk:      'Naobito Zenin Jujutsu Kaisen',
  panda_jjk:        'Panda Jujutsu Kaisen',
  mechamaru_jjk:    'Mechamaru Jujutsu Kaisen',
  kashimo_jjk:      'Hajime Kashimo Jujutsu Kaisen',
  uraume_jjk:       'Uraume Jujutsu Kaisen',
  ryu_ishigori_jjk: 'Ryu Ishigori Jujutsu Kaisen',
  gojo_infty:       'Satoru Gojo Jujutsu Kaisen',
  sukuna_shrine:    127213,

  // ── Attack on Titan additional cast ──────────────────────────
  mikasa:           40230,  armin:           40231,
  hange:            'Hange Zoe Attack on Titan',
  jean:             'Jean Kirstein Attack on Titan',
  historia_aot:     'Historia Reiss Attack on Titan',
  connie_aot:       'Connie Springer Attack on Titan',
  sasha_aot:        'Sasha Blouse Attack on Titan',
  reiner:           'Reiner Braun Attack on Titan',
  bertholdt:        'Bertholdt Hoover Attack on Titan',
  annie:            'Annie Leonhart Attack on Titan',
  zeke:             'Zeke Yeager Attack on Titan',
  pieck:            'Pieck Finger Attack on Titan',
  falco_aot:        'Falco Grice Attack on Titan',
  gabi_aot:         'Gabi Braun Attack on Titan',
  erwin:            'Erwin Smith Attack on Titan',
  ymir_fritz:       'Ymir Fritz Attack on Titan',

  // ── Hunter x Hunter additional cast ──────────────────────────
  leorio:           32,     chrollo:         'Chrollo Lucilfer Hunter x Hunter',
  illumi:           'Illumi Zoldyck Hunter x Hunter',
  neferpitou:       'Neferpitou Hunter x Hunter',
  feitan:           'Feitan Portor Hunter x Hunter',
  meruem:           'Meruem Hunter x Hunter',
  meruem_awakened:  'Meruem Hunter x Hunter',
  ging_hxh:         'Ging Freecss Hunter x Hunter',
  bisky_hxh:        'Biscuit Krueger Hunter x Hunter',
  palm_hxh:         'Palm Siberia Hunter x Hunter',
  knov_hxh:         'Knov Hunter x Hunter',
  morel_hxh:        'Morel Mackernasey Hunter x Hunter',

  // ── Fairy Tail additional cast ────────────────────────────────
  wendy:            'Wendy Marvell Fairy Tail',
  cana:             'Cana Alberona Fairy Tail',
  mirajane:         'Mirajane Strauss Fairy Tail',
  jellal:           'Jellal Fernandes Fairy Tail',
  irene:            'Irene Belserion Fairy Tail',
  zeref:            'Zeref Dragneel Fairy Tail',
  mard_geer_ft:     'Mard Geer Fairy Tail',
  god_serena_ft:    'God Serena Fairy Tail',
  brandish_ft:      'Brandish Fairy Tail',
  dimaria_ft:       'Dimaria Yesta Fairy Tail',
  neinhart_ft:      'Neinhart Fairy Tail',
  bloodman_ft:      'Bloodman Fairy Tail',
  invel_ft:         'Invel Yura Fairy Tail',
  ajeel_ft:         'Ajeel Ramal Fairy Tail',
  jacob_ft:         'Jacob Lessio Fairy Tail',
  yuno_spade:       'Yuno Fairy Tail',
  august_ft:        'August Fairy Tail',

  // ── FMA: Brotherhood additional cast ─────────────────────────
  riza_hawkeye:     38,     maes_hughes:     'Maes Hughes Fullmetal Alchemist',
  lust_fma:         'Lust Fullmetal Alchemist',
  wrath_fma:        'Wrath Fullmetal Alchemist',
  envy_fma:         'Envy Fullmetal Alchemist',
  greed_fma:        'Greed Fullmetal Alchemist',
  pride_fma:        'Pride Fullmetal Alchemist',
  van_hohenheim:    'Van Hohenheim Fullmetal Alchemist',
  mei_chan_fma:     'Mei Chan Fullmetal Alchemist',
  ling_yao_fma:     'Ling Yao Fullmetal Alchemist',
  lan_fan_fma:      'Lan Fan Fullmetal Alchemist',
  olivier_fma:      'Olivier Armstrong Fullmetal Alchemist',

  // ── The Seven Deadly Sins additional cast ────────────────────
  diane_sins:       107809, king_sins:        107810,
  gowther_sins:     107811, merlin_sins:      107812,
  meliodas_e:       'Meliodas Seven Deadly Sins',
  estarossa:        'Estarossa Seven Deadly Sins',
  zeldris:          'Zeldris Seven Deadly Sins',
  supreme_deity:    'Supreme Deity Seven Deadly Sins',
  demon_king_sins:  'Demon King Seven Deadly Sins',
  meliodas_assault: 'Meliodas Seven Deadly Sins',
  gilthunder_sins:  'Gilthunder Seven Deadly Sins',
  hendrickson_sins: 'Hendrickson Seven Deadly Sins',
  ludociel_sins:    'Ludociel Seven Deadly Sins',
  mael_sins:        'Mael Seven Deadly Sins',

  // ── Black Clover additional cast ─────────────────────────────
  charmy:           124444,
  asta_devil_bc:    123285, noelle_valkyrie:  123283,
  magna_bc:         'Magna Swing Black Clover',
  luck_bc:          'Luck Voltia Black Clover',
  finral_bc:        'Finral Roulacase Black Clover',
  henry_bc:         'Henry Legolant Black Clover',
  liebe_bc:         'Liebe Black Clover',
  nacht_bc:         'Nacht Black Clover',
  secre_bc:         'Secre Swallowtail Black Clover',
  zenon:            'Zenon Zogratis Black Clover',
  dante_bc:         'Dante Zogratis Black Clover',
  vanica:           'Vanica Zogratis Black Clover',
  megicula:         'Megicula Black Clover',
  lucifero_bc:      'Lucifero Black Clover',

  // ── Overlord additional cast ──────────────────────────────────
  ainz_ooal:        'Ainz Ooal Gown Overlord',
  shalltear:        'Shalltear Bloodfallen Overlord',
  cocytus_ov:       'Cocytus Overlord',
  demiurge_ov:      'Demiurge Overlord',
  mare_ov:          'Mare Bello Fiore Overlord',
  sebas_ov:         'Sebas Tian Overlord',
  entoma_ov:        'Entoma Vasilissa Zeta Overlord',
  lupusregina_ov:   'Lupusregina Beta Overlord',

  // ── Re:Zero additional cast ───────────────────────────────────
  beatrice_rzr:     109864,
  roswaal:          'Roswaal Re:Zero',
  priscilla_rzr:    'Priscilla Re:Zero',
  wilhelm_rzr:      'Wilhelm Re:Zero',
  echidna_rzr:      'Echidna Re:Zero',
  frederica_rzr:    'Frederica Baumann Re:Zero',
  garfiel_rzr:      'Garfiel Tinsel Re:Zero',
  ram_rzr:          'Ram Re:Zero',

  // ── Chainsaw Man additional cast ─────────────────────────────
  aki_hayakawa:     156920, himeno_csm:      'Himeno Chainsaw Man',
  violence_fiend:   'Violence Fiend Chainsaw Man',
  beam_csm:         'Beam Chainsaw Man',
  quanxi_csm:       'Quanxi Chainsaw Man',
  reze_csm:         'Reze Chainsaw Man',
  kobeni_csm:       'Kobeni Higashiyama Chainsaw Man',
  angel_devil_csm:  'Angel Devil Chainsaw Man',
  santa_claus_csm:  'Santa Claus Chainsaw Man',
  fami_csm:         'Famine Devil Chainsaw Man',

  // ── Code Geass additional cast ────────────────────────────────
  suzaku_cg:        'Suzaku Kururugi Code Geass',
  cc_cg:            'C.C. Code Geass',
  schneizel_cg:     'Schneizel el Britannia Code Geass',
  kallen_cg:        'Kallen Stadtfeld Code Geass',
  orange_cg:        'Jeremiah Gottwald Code Geass',

  // ── Gurren Lagann additional cast ────────────────────────────
  yoko_gl:          'Yoko Littner Gurren Lagann',
  viral_gl:         'Viral Gurren Lagann',
  nia_gl:           'Nia Teppelin Gurren Lagann',
  lordgenome_gl:    'Lordgenome Gurren Lagann',
  lordgenome_true:  'Lordgenome Gurren Lagann',

  // ── Gintama additional cast ───────────────────────────────────
  shinpachi_gin:    'Shinpachi Shimura Gintama',
  kagura_gin:       'Kagura Gintama',
  takasugi_gin:     'Shinsuke Takasugi Gintama',
  katsura_gin:      'Katsura Kotaro Gintama',
  okita_gin:        'Sogo Okita Gintama',
  hijikata_gin:     'Toshiro Hijikata Gintama',
  batou_gin:        850,

  // ── Spy x Family additional cast ─────────────────────────────
  damian_sxf:       'Damian Desmond Spy x Family',
  yuri_sxf:         'Yuri Briar Spy x Family',
  franky_sxf:       'Franky Franklin Spy x Family',
  becky_sxf:        'Becky Blackbell Spy x Family',
  boss_sxf:         'Donovan Desmond Spy x Family',

  // ── Inuyasha additional cast ──────────────────────────────────
  sesshomaru:       'Sesshomaru Inuyasha',
  naraku_iy:        'Naraku Inuyasha',
  kikyo_iy:         'Kikyo Inuyasha',
  kagome_iy:        'Kagome Higurashi Inuyasha',
  miroku_iy:        'Miroku Inuyasha',
  sango_iy:         'Sango Inuyasha',

  // ── Yu Yu Hakusho additional cast ────────────────────────────
  kuwabara:         734,   younger_toguro:   'Younger Toguro Yu Yu Hakusho',
  raizen:           'Raizen Yu Yu Hakusho',
  genkai_yyh:       'Genkai Yu Yu Hakusho',
  toguro_elder_yyh: 'Elder Toguro Yu Yu Hakusho',
  sensui_yyh:       'Shinobu Sensui Yu Yu Hakusho',
  itsuki_yyh:       'Itsuki Yu Yu Hakusho',

  // ── Steins;Gate additional cast ───────────────────────────────
  kurisu_sg:        'Kurisu Makise Steins Gate',
  mayuri_sg:        'Mayuri Shiina Steins Gate',
  suzuha_sg:        'Suzuha Amane Steins Gate',

  // ── Death Note additional cast ────────────────────────────────
  mello_dn:         'Mello Death Note',   matt_dn:    'Matt Death Note',
  ryuk_dn:          'Ryuk Death Note',    rem_dn:     'Rem Death Note',

  // ── Cowboy Bebop additional cast ──────────────────────────────
  jet_black:        'Jet Black Cowboy Bebop',
  faye_valentine:   'Faye Valentine Cowboy Bebop',
  ed_cowboy:        'Edward Wong Cowboy Bebop',
  vicious_cowboy:   'Vicious Cowboy Bebop',

  // ── One Punch Man additional cast ─────────────────────────────
  tatsumaki:        73937,  sonic_opm:       'Speed-o-Sound Sonic One Punch Man',
  bang_opm:         'Silver Fang One Punch Man',
  boros_opm:        'Boros One Punch Man',
  genos_jr:         73936,  king_opm:        'King One Punch Man',
  fubuki_opm:       'Fubuki One Punch Man',
  flashy_opm:       'Flashy Flash One Punch Man',
  atomic_opm:       'Atomic Samurai One Punch Man',
  silver_fang_opm:  'Bang One Punch Man',
  garou_opm:        'Garou One Punch Man',

  // ── Vinland Saga additional cast ─────────────────────────────
  bjorn_vs:         'Bjorn Vinland Saga',
  canute_vs:        'Canute Vinland Saga',
  leif_vs:          'Leif Erikson Vinland Saga',
  sigurd_vs:        'Sigurd Vinland Saga',
  floki_vs:         'Floki Vinland Saga',
  einar_vs:         'Einar Vinland Saga',

  // ── Sword Art Online additional cast ─────────────────────────
  eugeo_sao:        'Eugeo Sword Art Online',
  alice_sao:        'Alice Zuberg Sword Art Online',
  sinon_sao:        'Sinon Sword Art Online',
  leafa_sao:        'Leafa Sword Art Online',
  lisbeth_sao:      'Lisbeth Sword Art Online',
  kirito_ggo:       36827,

  // ── Log Horizon ───────────────────────────────────────────────
  shiroe_lh:        'Shiroe Log Horizon',
  akatsuki_lh:      'Akatsuki Log Horizon',
  naotsugu_lh:      'Naotsugu Log Horizon',
  nyanta_lh:        'Nyanta Log Horizon',

  // ── No Game No Life ───────────────────────────────────────────
  sora_ngnl:        'Sora No Game No Life',
  shiro_ngnl:       'Shiro No Game No Life',
  jibril_ngnl:      'Jibril No Game No Life',
  stephanie_ngnl:   'Stephanie Dola No Game No Life',

  // ── KonoSuba ─────────────────────────────────────────────────
  kazuma_ksb:       'Kazuma Satou KonoSuba',
  aqua_ksb:         'Aqua KonoSuba',
  megumin_ksb:      'Megumin KonoSuba',
  kazuma_ks:        'Kazuma Satou KonoSuba',
  aqua_ks:          'Aqua KonoSuba',
  megumin_ks:       'Megumin KonoSuba',
  darkness_ks:      'Darkness KonoSuba',
  wiz_ks:           'Wiz KonoSuba',

  // ── Shield Hero ───────────────────────────────────────────────
  naofumi:          'Naofumi Iwatani Shield Hero',
  raphtalia:        'Raphtalia Shield Hero',
  naofumi_rshr:     'Naofumi Iwatani Shield Hero',
  filo_rshr:        'Filo Shield Hero',
  glass_rshr:       'Glass Shield Hero',

  // ── That Time I Got Reincarnated as a Slime additional ────────
  shion_slime:      'Shion Slime',     shuna_slime:  'Shuna Slime',
  veldora_slime:    'Veldora Tempest Slime',
  diablo_slime:     'Diablo Slime',    milim_slime:  'Milim Nava Slime',
  clayman_slime:    'Clayman Slime',
  luminous_slime:   'Luminous Valentine Slime',
  hinata_slime:     'Hinata Sakaguchi Slime',

  // ── DanMachi ──────────────────────────────────────────────────
  bell_cranel:      'Bell Cranel DanMachi',
  aiz_wallenstein:  'Aiz Wallenstein DanMachi',
  hestia_dn:        'Hestia DanMachi',
  ryu_lion_dn:      'Ryu Lion DanMachi',
  welf_dn:          'Welf Crozzo DanMachi',
  lilly_dn:         'Liliruca Arde DanMachi',

  // ── Mushoku Tensei ────────────────────────────────────────────
  rudeus:           'Rudeus Greyrat Mushoku Tensei',
  eris_mt:          'Eris Boreas Greyrat Mushoku Tensei',
  sylphiette:       'Sylphiette Mushoku Tensei',

  // ── Frieren ───────────────────────────────────────────────────
  fern_frieren:     'Fern Frieren Beyond Journey',
  frieren_e:        'Frieren Beyond Journey',
  flamme_frieren:   'Flamme Frieren Beyond Journey',

  // ── Neon Genesis Evangelion additional ───────────────────────
  shinji_nge:       'Shinji Ikari Neon Genesis Evangelion',
  rei_nge:          'Rei Ayanami Neon Genesis Evangelion',
  asuka_nge:        'Asuka Langley Evangelion',
  kaworu_nge:       'Kaworu Nagisa Evangelion',
  misato_nge:       'Misato Katsuragi Evangelion',
  ritsuko_nge:      'Ritsuko Akagi Evangelion',

  // ── Kakegurui ─────────────────────────────────────────────────
  yumeko:           'Yumeko Jabami Kakegurui',
  kirari:           'Kirari Momobami Kakegurui',
  mary_saotome_kk:  'Mary Saotome Kakegurui',
  midari_kk:        'Midari Ikishima Kakegurui',
  yumemi_kk:        'Yumemi Yumemite Kakegurui',

  // ── Assassination Classroom ───────────────────────────────────
  karma_akabane:    'Karma Akabane Assassination Classroom',
  korosensei:       'Korosensei Assassination Classroom',
  nagisa_ac:        'Nagisa Shiota Assassination Classroom',
  kaede_ac:         'Kaede Kayano Assassination Classroom',
  irina_ac:         'Irina Jelavic Assassination Classroom',

  // ── Berserk ───────────────────────────────────────────────────
  guts_berserk:     'Guts Berserk',
  griffith_berserk: 'Griffith Berserk',
  femto_griffith:   'Femto Berserk',
  schierke_brsrk:   'Schierke Berserk',
  isidro_brsrk:     'Isidro Berserk',
  casca_brsrk:      'Casca Berserk',

  // ── Rurouni Kenshin ───────────────────────────────────────────
  himura_kenshin:   'Himura Kenshin Rurouni Kenshin',
  sanosuke_sagara:  'Sanosuke Sagara Rurouni Kenshin',
  hajime_saito:     'Hajime Saito Rurouni Kenshin',
  makoto_shishio:   'Makoto Shishio Rurouni Kenshin',
  aoshi_shinomori:  'Aoshi Shinomori Rurouni Kenshin',

  // ── Samurai Champloo ─────────────────────────────────────────
  jin_sc:           'Jin Samurai Champloo',
  mugen_sc:         'Mugen Samurai Champloo',
  fuu_sc:           'Fuu Samurai Champloo',

  // ── Claymore ──────────────────────────────────────────────────
  claire_cy:        'Clare Claymore',   teresa_cy:   'Teresa Claymore',
  miria_cy:         'Miria Claymore',   jean_cy:     'Jean Claymore',

  // ── Seraph of the End ────────────────────────────────────────
  yuichiro_soe:     'Yuichiro Hyakuya Seraph of the End',
  mikaela_soe:      'Mikaela Hyakuya Seraph of the End',
  shinya_soe:       'Shinya Hiragi Seraph of the End',
  krul_soe:         'Krul Tepes Seraph of the End',

  // ── Fate Series ──────────────────────────────────────────────
  saber_fate:       'Artoria Pendragon Fate',
  emiya_fate:       'Archer EMIYA Fate',
  gilgamesh_fate:   'Gilgamesh Fate',
  cu_chulainn_fate: 'Cu Chulainn Fate',
  jeanne_fate:      'Jeanne d Arc Fate Apocrypha',
  medusa_fate:      'Rider Medusa Fate',

  // ── Puella Magi Madoka Magica ────────────────────────────────
  madoka_magica:    'Madoka Kaname Puella Magi Madoka Magica',
  homura_magica:    'Homura Akemi Puella Magi Madoka Magica',
  sayaka_magica:    'Sayaka Miki Puella Magi Madoka Magica',
  mami_magica:      'Mami Tomoe Puella Magi Madoka Magica',
  kyoko_magica:     'Kyoko Sakura Puella Magi Madoka Magica',

  // ── Violet Evergarden ────────────────────────────────────────
  violet_vg:        'Violet Evergarden',
  claudia_vg:       'Claudia Hodgins Violet Evergarden',
  gilbert_vg:       'Gilbert Bougainvillea Violet Evergarden',

  // ── Made in Abyss ────────────────────────────────────────────
  riko_mia_made:    'Riko Made in Abyss',
  reg_mia_made:     'Reg Made in Abyss',
  nanachi_mia_made: 'Nanachi Made in Abyss',
  bondrewd_mia:     'Bondrewd Made in Abyss',

  // ── Angel Beats ───────────────────────────────────────────────
  otonashi_ab:      'Otonashi Yuzuru Angel Beats',
  kanade_ab:        'Kanade Tachibana Angel Beats',
  yuri_ab:          'Yuri Nakamura Angel Beats',

  // ── My Teen Romantic Comedy SNAFU ────────────────────────────
  hachiman_og:      'Hachiman Hikigaya Oregairu',
  yukino_og:        'Yukino Yukinoshita Oregairu',
  yui_og:           'Yui Yuigahama Oregairu',

  // ── Toradora ──────────────────────────────────────────────────
  ryuuji_td:        'Ryuuji Takasu Toradora',
  taiga_td:         'Taiga Aisaka Toradora',
  minori_td:        'Minori Kushieda Toradora',

  // ── Clannad ───────────────────────────────────────────────────
  tomoya_cl:        'Tomoya Okazaki Clannad',
  nagisa_cl:        'Nagisa Furukawa Clannad',

  // ── Dr. Stone ─────────────────────────────────────────────────
  senku:            'Senku Ishigami Dr Stone',
  senku_ishigami:   'Senku Ishigami Dr Stone',
  tsukasa_stone:    'Tsukasa Shishio Dr Stone',
  chrome_stone:     'Chrome Dr Stone',
  kohaku_stone:     'Kohaku Dr Stone',
  gen_asagiri_stone:'Gen Asagiri Dr Stone',
  ryusui_stone:     'Ryusui Nanami Dr Stone',

  // ── The Promised Neverland ────────────────────────────────────
  emma_tpn:         'Emma Promised Neverland',
  norman_tpn:       'Norman Promised Neverland',
  ray_tpn:          'Ray Promised Neverland',
  isabella_tpn:     'Isabella Mama Promised Neverland',
  musica_tpn:       'Musica Promised Neverland',

  // ── Haikyuu!! ─────────────────────────────────────────────────
  shoyo_hinata:     140798, tobio_kageyama: 140799,
  hinata_hq:        140798, kageyama_hq:    140799,
  kuroo_hq:         'Kuroo Haikyuu',    ushijima_hq:  'Ushijima Haikyuu',
  tsukishima_hq:    'Kei Tsukishima Haikyuu',
  yamaguchi_hq:     'Tadashi Yamaguchi Haikyuu',
  nishinoya_hq:     'Yu Nishinoya Haikyuu',
  oikawa_hq:        'Tooru Oikawa Haikyuu',
  bokuto_hq:        'Kotaro Bokuto Haikyuu',
  akaashi_hq:       'Keiji Akaashi Haikyuu',
  kenma_hq:         'Kenma Kozume Haikyuu',
  lev_hq:           'Lev Haiba Haikyuu',

  // ── Kuroko no Basuke ─────────────────────────────────────────
  akashi_kb:        'Seijuro Akashi Kuroko Basketball',
  aomine_kb:        'Daiki Aomine Kuroko Basketball',
  kuroko_kb:        'Tetsuya Kuroko Kuroko Basketball',
  midorima_kb:      'Shintaro Midorima Kuroko Basketball',
  murasakibara_kb:  'Atsushi Murasakibara Kuroko Basketball',
  kagami_kb:        'Taiga Kagami Kuroko Basketball',
  hyuga_kb:         'Junpei Hyuga Kuroko Basketball',
  riko_kb:          'Riko Aida Kuroko Basketball',

  // ── Hajime no Ippo ────────────────────────────────────────────
  ippo_mk:          15,     takamura_mk:    'Takamura Mamoru Hajime no Ippo',
  miyata_mk:        'Miyata Ichiro Hajime no Ippo',
  itagaki_mk:       'Itagaki Manabu Hajime no Ippo',

  // ── Record of Ragnarok ────────────────────────────────────────
  oliver_phoenix:   'Oliver Phoenix Record of Ragnarok',
  brunhilde_ror:    'Brunhilde Record of Ragnarok',
  thor_ror:         'Thor Record of Ragnarok',
  lu_bu_ror:        'Lu Bu Record of Ragnarok',
  adam_ror:         'Adam Record of Ragnarok',
  zerofuku_ror:     'Zerofuku Record of Ragnarok',
  leonidas_ror:     'Leonidas Record of Ragnarok',
  okita_ror:        'Okita Souji Record of Ragnarok',
  rudra_ror:        'Rudra Record of Ragnarok',
  tesla_ror:        'Nikola Tesla Record of Ragnarok',
  jack_ror:         'Jack the Ripper Record of Ragnarok',
  heracles_ror:     'Heracles Record of Ragnarok',
  sasaki_ror:       'Sasaki Kojiro Record of Ragnarok',
  poseidon_ror:     'Poseidon Record of Ragnarok',
  buddha_ror:       'Buddha Record of Ragnarok',
  raiden_ror:       'Raiden Record of Ragnarok',
  qin_shi_ror:      'Qin Shi Huang Record of Ragnarok',
  beelzebub_ror:    'Beelzebub Record of Ragnarok',

  // ── Baki additional ──────────────────────────────────────────
  speck_baki:       'Spec Baki',
  yanagi_baki:      'Yanagi Baki',
  kaku_kaioh_baki:  'Kaku Kaioh Baki',
  mount_toba_baki:  'Mount Toba Baki',
  hector_baki:      'Hector Doyle Baki',

  // ── Blue Lock additional ──────────────────────────────────────
  ryota_bl:         'Ryota Blue Lock',
  yukimiya_bl:      'Kenyu Yukimiya Blue Lock',
  tokimitsu_bl:     'Aiku Tokimitsu Blue Lock',
  sendou_bl:        'Jyubei Aryu Blue Lock',
  aryu_bl:          'Aryu Blue Lock',
  loki_bl:          'Loki Blue Lock',

  // ── Lookism additional ────────────────────────────────────────
  soo_il_jeong_lk:  'Soo-Il Jeong Lookism',
  james_lee_lk:     'James Lee Lookism',
  jiho_park_lk:     'Jiho Park Lookism',
  jae_hyun_lk:      'Jae-Hyun Lookism',
  park_hyeong_lk:   'Park Hyeong-Seok Lookism',

  // ── Solo Leveling ─────────────────────────────────────────────
  jinwoo_r:         'Sung Jinwoo Solo Leveling',
  jinwoo_e:         'Sung Jinwoo Solo Leveling',
  jinwoo_monarch:   'Sung Jinwoo Solo Leveling',
  jin_woo_slm:      'Sung Jinwoo Solo Leveling',
  ashborn_sl:       'Ashborn Shadow Monarch Solo Leveling',
  baran_sl:         'Baran Solo Leveling',
  iron_sl:          'Iron Solo Leveling',
  tusk_slr:         'Tusk Solo Leveling',
  cha_hae_in_sl:    'Cha Hae-In Solo Leveling',
  yoo_jinho_sl:     'Yoo Jin-Ho Solo Leveling',
  woo_jinchul_sl:   'Woo Jin-Chul Solo Leveling',
  go_gunhee_sl:     'Go Gun-Hee Solo Leveling',
  igris_sl:         'Igris Solo Leveling',
  beru_sl:          'Beru Solo Leveling',
  tusk_sl:          'Tusk Solo Leveling',
  antares_sl:       'Antares Solo Leveling',
  liu_zhigang_sl:   'Liu Zhigang Solo Leveling',
  dongsoo_hwang_sl: 'Dongsoo Hwang Solo Leveling',
  goto_ryuji_sl:    'Goto Ryuji Solo Leveling',
  christopher_reid_sl:'Christopher Reid Solo Leveling',
  choi_jongin_sl:   'Choi Jong-In Solo Leveling',
  barion_sl:        'Barion Solo Leveling',
  hwang_dongsuk_sl: 'Hwang Dongsuk Solo Leveling',
  thomas_andre:     'Thomas Andre Solo Leveling',

  // ── Tower of God ──────────────────────────────────────────────
  khun_aguero:      'Khun Aguero Agnes Tower of God',
  rak_tog:          'Rak Wraithraiser Tower of God',
  king_zahard:      'King Zahard Tower of God',
  bam_tog:          'Bam Twenty Fifth Bam Tower of God',
  khun_aguero_tog:  'Khun Aguero Agnes Tower of God',
  endorsi_tog:      'Endorsi Zahard Tower of God',
  anaak_tog:        'Anaak Zahard Tower of God',
  shibisu_tog:      'Shibisu Tower of God',
  hatz_tog:         'Hatz Tower of God',
  yuri_zahard_tog:  'Yuri Zahard Tower of God',
  evan_edrok_tog:   'Evan Edrok Tower of God',
  karaka_tog:       'Karaka Tower of God',
  ha_yura_tog:      'Ha Yura Tower of God',
  jahad_tog:        'King Jahad Tower of God',
  phonsekal_tog:    'Phonsekal Lauroe Tower of God',
  ha_jinsung_tog:   'Ha Jinsung Tower of God',
  evankhell_tog:    'Evankhell Tower of God',
  beta_tog:         'Beta Tower of God',
  lo_po_tog:        'Lo Po Bia Elias Tower of God',
  wangnan_tog:      'Wangnan Ja Tower of God',

  // ── Omniscient Reader's Viewpoint ─────────────────────────────
  kim_dokja_orv:    'Kim Dokja Omniscient Reader',
  yoo_joonghyuk_orv:'Yoo Joonghyuk Omniscient Reader',
  jung_heewon_orv:  'Jung Heewon Omniscient Reader',
  lee_jihye_orv:    'Lee Jihye Omniscient Reader',
  han_sooyoung_orv: 'Han Sooyoung Omniscient Reader',
  uriel_orv:        'Uriel Omniscient Reader',
  bihyung_orv:      'Bihyung Omniscient Reader',
  shin_yoosung_orv: 'Shin Yoosung Omniscient Reader',
  lee_hyunsong_orv: 'Lee Hyunsong Omniscient Reader',
  lee_gilyoung_orv: 'Lee Gilyoung Omniscient Reader',
  yoo_sangah_orv:   'Yoo Sangah Omniscient Reader',
  jang_hayoung_orv: 'Jang Hayoung Omniscient Reader',
  gong_pildu_orv:   'Gong Pildu Omniscient Reader',
  kim_namwoon_orv:  'Kim Namwoon Omniscient Reader',
  dokja_king_orv:   'Kim Dokja Omniscient Reader',

  // ── Eleceed ───────────────────────────────────────────────────
  jiwoo_seo_el:     'Jiwoo Seo Eleceed',
  kayden_break_el:  'Kayden Break Eleceed',
  inhyuk_jang_el:   'Inhyuk Jang Eleceed',
  jisuk_kwon_el:    'Jisuk Kwon Eleceed',
  suyeon_baek_el:   'Suyeon Baek Eleceed',
  daye_seong_el:    'Daye Seong Eleceed',
  wooin_lee_el:     'Wooin Lee Eleceed',
  dawn_el:          'Dawn Eleceed',
  kartein_el:       'Kartein Eleceed',
  lorcan_el:        'Lorcan Eleceed',

  // ── Weak Hero ─────────────────────────────────────────────────
  gray_yeon_wh:     'Gray Yeon Weak Hero',
  wolf_kim_wh:      'Wolf Kim Weak Hero',
  ronan_joo_wh:     'Ronan Joo Weak Hero',
  ben_park_wh:      'Ben Park Weak Hero',
  jake_kim_wh:      'Jake Kim Weak Hero',
  donald_na_wh:     'Donald Na Weak Hero',
  phillip_im_wh:    'Phillip Im Weak Hero',
  stephen_han_wh:   'Stephen Han Weak Hero',
  goo_siu_wh:       'Goo Siu Weak Hero',
  si_young_wh:      'Si Young Weak Hero',

  // ── Noblesse ──────────────────────────────────────────────────
  cadis_etrama_nb:  'Cadis Etrama Di Raizel Noblesse',
  frankenstein_nb:  'Frankenstein Noblesse',
  m21_nb:           'M-21 Noblesse',
  regis_nb:         'Regis Noblesse',
  seira_nb:         'Seira J. Loyard Noblesse',
  rael_nb:          'Rael Kertia Noblesse',
  takeo_nb:         'Takeo Noblesse',
  ikhan_nb:         'Ikhan Noblesse',
  tao_nb:           'Tao Noblesse',
  aris_nb:          'Aris Noblesse',

  // ── The Beginning After the End (TBATE) ──────────────────────
  arthur_tbate:     'Arthur Leywin Beginning After End',
  sylvie_tbate:     'Sylvie Beginning After End',
  tessia_tbate:     'Tessia Eralith Beginning After End',
  seris_tbate:      'Seris Vritra Beginning After End',
  nico_tbate:       'Nico Beginning After End',
  virion_tbate:     'Virion Beginning After End',
  agrona_tbate:     'Agrona Vritra Beginning After End',
  caera_tbate:      'Caera Denoir Beginning After End',

  // ── God of High School ────────────────────────────────────────
  han_daewi:        'Han Daewi God of High School',
  yu_mira:          'Yu Mira God of High School',
  park_ilpyo:       'Park Ilpyo God of High School',
  jin_mori:         'Jin Mori God of High School',
  jin_taejin_ghs:   'Jin Taejin God of High School',
  judge_q_ghs:      'Judge Q God of High School',
  judge_p_ghs:      'Judge P God of High School',
  judge_r_ghs:      'Judge R God of High School',
  mira_god_ghs:     'Yu Mira God of High School',
  daewi_god_ghs:    'Han Daewi God of High School',
  ilpyo_fox_ghs:    'Park Ilpyo God of High School',
  ji_seung_ghs:     'Ji Seung God of High School',
  ma_bora_ghs:      'Ma Bora God of High School',
  gang_manseok_ghs: 'Gang Manseok God of High School',
  robert_lime_ghs:  'Robert Lime God of High School',
  nox_ultio_ghs:    'Nox Ultio God of High School',
  taek_jaesan_ghs:  'Taek Jaesan God of High School',
  lee_sungchul_ghs: 'Lee Sungchul God of High School',
  nox_comm_ghs:     'Nox Commander God of High School',
  byeon_jh_ghs:     'Byeon Jinhyuk God of High School',
  original_q_ghs:   'Original Q God of High School',
  scarlet_king:     'God of High School Scarlet King',

  // ── Wind Breaker ──────────────────────────────────────────────
  jo_jahyun_wb:     'Jo Jahyun Wind Breaker',
  vinny_wb:         'Vinny Wind Breaker',
  dom_jongduk_wb:   'Dom Jongduk Wind Breaker',
  bong_su_wb:       'Bong Su Wind Breaker',
  woo_geon_wb:      'Woo Geon Wind Breaker',
  sim_youngtak_wb:  'Sim Youngtak Wind Breaker',
  shin_joon_wb:     'Shin Joon Wind Breaker',
  kang_hyunmin_wb:  'Kang Hyunmin Wind Breaker',

  // ── Breaker ───────────────────────────────────────────────────
  chun_woo_han:     'Chun Woo Han Breaker',
  shi_woon_yi:      'Shi Woon Yi Breaker',
  chang_ho_brkr:    'Chang Ho Breaker',
  jinie_yu_brkr:    'Jinie Yu Breaker',
  kang_joonwoo_brkr:'Kang Joonwoo Breaker',

  // ── Nano Machine ─────────────────────────────────────────────
  cheon_yeo_woon_nm:'Cheon Yeo Woon Nano Machine',
  hing_wunja_nm:    'Hing Wunja Nano Machine',
  mun_ku_nm:        'Mun Ku Nano Machine',
  bi_ryeon_nm:      'Bi Ryeon Nano Machine',
  chun_yeowun_nm:   'Chun Yeowun Nano Machine',

  // ── Return of the Mount Hua Sect ─────────────────────────────
  desir_arman_rm:   'Desir Arman Magical Swordsman',
  romantica_rm:     'Romantica Magical Swordsman',
  pram_rm:          'Pram Magical Swordsman',
  adjest_rm:        'Adjest Magical Swordsman',
  keinzels_rm:      'Keinzels Magical Swordsman',
  yu_jin_rm:        'Yu Jin Return Disaster Class',
  baek_cheon_rm:    'Baek Cheon Return Disaster Class',
  hyun_young_rm:    'Hyun Young Return Disaster Class',
  tang_soso_rm:     'Tang Soso Return Disaster Class',

  // ── My Exercises ─────────────────────────────────────────────
  ijin_yu_me:       'Ijin Yu Mercenary Enrollment',
  yuna_yu_me:       'Yuna Yu Mercenary Enrollment',
  mangu_ryu_me:     'Mangu Ryu Mercenary Enrollment',
  dojun_ryu_me:     'Dojun Ryu Mercenary Enrollment',
  instructor_me:    'Instructor Mercenary Enrollment',
  hajun_shin_me:    'Hajun Shin Mercenary Enrollment',

  // ── Sword King misc ───────────────────────────────────────────
  cheon_jiho_ms:    'Sword King Survival',
  sunwoo_ks:        'Sunwoo Sword King',
  baek_seoin_ks:    'Baek Seoin Sword King',
  jayden_ks:        'Jayden Sword King',

  // ── Murim Login ───────────────────────────────────────────────
  jin_taekyung_ml:  'Jin Taekyung Murim Login',
  goo_hyun_ml:      'Goo Hyun Murim Login',
  soma_ml:          'Soma Murim Login',
  namgung_ml:       'Namgung Murim Login',
  hwasan_ml:        'Hwasan Murim Login',

  // ── Kang Hunter ───────────────────────────────────────────────
  woojin_kim_kh:    'Kim Woojin The World After the Fall',
  han_sung_jin_kh:  'Han Sung Jin The World After the Fall',
  lee_jinho_kh:     'Lee Jinho The World After the Fall',
  shin_jongyeon_kh: 'Shin Jongyeon The World After the Fall',

  // ── Dungeon Reset ─────────────────────────────────────────────
  dawoon_jung_dr:   'Dawoon Jung Dungeon Reset',
  jung_soyeon_dr:   'Jung Soyeon Dungeon Reset',
  dungeon_reset_mc: 'Dungeon Reset',

  // ── Solo Login ────────────────────────────────────────────────
  yeon_woosung_slr: 'Yeon Woosung Solo Login',
  edora_slr:        'Edora Solo Login',
  valdebich_slr:    'Valdebich Solo Login',
  arthia_slr:       'Arthia Solo Login',
  kronos_slr:       'Kronos Solo Login',

  // ── Returner / misc manhwa ───────────────────────────────────
  seo_jumin_trk:    'Seo Jumin Returner',
  yoo_minyeon_trk:  'Yoo Minyeon Returner',
  kim_hyun_soo_trk: 'Kim Hyun Soo Returner',
  chloe_trk:        'Chloe Returner',
  jinhyuk_kang_mln: 'Jinhyuk Kang Manhwa',
  kim_seolhwa_mln:  'Kim Seolhwa Manhwa',
  lee_se_hun_mln:   'Lee Se Hun Manhwa',
  yuki_mln:         'Yuki Manhwa',
  scholar_mc_sr:    'Scholar Reincarnation',
  yura_sr:          'Yura Manhwa',
  hwang_sr:         'Hwang Manhwa',
  heedo_sr:         'Heedo Manhwa',
  jee_han_gm:       'Jee Han Gamer',
  moojin_gm:        'Moojin Gamer',
  shin_soo_gm:      'Shin Soo Gamer',
  ohsung_gm:        'Ohsung Gamer',
  kim_hyunwoo_lug:  'Kim Hyunwoo Legendary Uncanny',
  indra_lug:        'Indra Legendary Uncanny',
  shiva_lug:        'Shiva Legendary Uncanny',
  odin_lug:         'Odin Legendary Uncanny',
  john_doe_uo:      'John Doe Unholy Order',
  seraphina_uo:     'Seraphina Unholy Order',
  remi_uo:          'Remi Unholy Order',
  arlo_uo:          'Arlo Unholy Order',
  shirone_im:       'Shirone Infinite Mage',
  rian_im:          'Rian Infinite Mage',
  iruki_im:         'Iruki Infinite Mage',
  siena_im:         'Siena Infinite Mage',
  vincenzo_im:      'Vincenzo Infinite Mage',
  taichi_murakami:  'Taichi Murakami',
  chinatsu_bb:      'Chinatsu Blue Box',
  younggun_thb:     'Hero Is Back',
  seiya_thb:        'Hero Is Back',
  jinhae_nma:       'Jinhae Manhwa',
  hyunsung_max:     'Max Level Returner',
  david_max:        'David Max Level',
  taewon_mk:        'Taewon Martial Peak',
  jinho_il:         'Jinho Manhwa',
  ryong_ahl:        'Ryong Manhwa',
  gunil_fw:         'Gunil Manhwa',
  jinsung_fd:       'Jinsung Manhwa',
  kang_hansoo_ft:   'Kang Hansoo Manhwa',
  hero_elf_ft:      'Fantasy Manhwa Elf',
  demon_ft:         'Fantasy Manhwa Demon',
  saintess_ft:      'Fantasy Manhwa Saintess',
  hclw_warrior:     'Manhwa Warrior',
  dark_hclw:        'Manhwa Dark',
  sora_hclw:        'Sora Manhwa',
  nightmare_hclw:   'Nightmare Manhwa',
  armes_hclw:       'Armes Manhwa',

  // ── Raid on the Demon King (RDH) ─────────────────────────────
  cha_gang_rdh:     'Cha Gang Manhwa',
  seo_ahjin_rdh:    'Seo Ahjin Manhwa',
  kim_sunghan_rdh:  'Kim Sunghan Manhwa',
  gaia_rdh:         'Gaia Manhwa',
  twelve_rdh:       'Twelve Manhwa',

  // ── Weapon card AniList ID fallbacks ─────────────────────────
  madara_weapon:    53901,  itachi_weapon:    14,
  shanks_weapon:    727,    aizen_weapon:     59,
  netero_weapon:    41829,  kira_weapon:      12055,
  kaido_weapon:     63935,  muzan_weapon:     127221,
  sukuna_weapon:    127213, acnologia_weapon: 63920,
  escanor_weapon:   107815, daniel_weapon:    194055,
  zack_weapon:      194059, jake_kim_weapon:  194066,
  samuel_weapon:    194062, pickle_weapon:    117083,
  gun_weapon:       194065, johan_weapon:     194064,
  tom_lee_weapon:   194067, musashi_weapon:   117084,
  yujiro_weapon:    20049,  giorno_weapon:    10529,
  simon_weapon:     2257,   saitama_weapon:   73935,
  yhwach_weapon:    68537,  whitebeard_weapon:2751,
  blackbeard_weapon:3331,   beerus_weapon:    76348,
};

// ── In-memory cache (card_id -> imageUrl) ────────────────────
let cache = { ...SEED };

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      // SEED wins over auto-fetched; manualOverrides win over everything
      cache = { ...saved, ...SEED, ...manualOverrides };
    } else {
      cache = { ...SEED, ...manualOverrides };
    }
    // Persist entries to disk immediately so restarts don't start from scratch
    saveCache();
  } catch (_) {}
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (_) {}
}

/** Synchronous lookup — returns URL or null */
function getImage(cardId) {
  return cache[cardId] ?? null;
}

/**
 * Fetch a character image from AniList.
 * Accepts either a numeric AniList character ID (guaranteed correct)
 * or a search name string (fuzzy search — avoid for ambiguous names).
 */
async function fetchFromAniList(nameOrId) {
  try {
    const query = typeof nameOrId === 'number'
      ? `{ Character(id: ${nameOrId}) { image { large } } }`
      : `{ Character(search: "${String(nameOrId).replace(/"/g, '\\"')}") { image { large } } }`;

    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (resp.status === 429) return null;
    const json = await resp.json();
    return json.data?.Character?.image?.large ?? null;
  } catch (_) {
    return null;
  }
}

/** Fetch a character image from Jikan (MyAnimeList) by search name — string only */
async function fetchFromJikan(searchName) {
  if (typeof searchName !== 'string') return null;
  try {
    const encoded = encodeURIComponent(searchName);
    const resp = await fetch(`https://api.jikan.moe/v4/characters?q=${encoded}&limit=1`);
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.data?.[0]?.images?.jpg?.image_url ?? null;
  } catch (_) {
    return null;
  }
}

/**
 * Try to fetch an image for a card that has no cached entry.
 * Prefers direct AniList ID lookup (numeric SEARCH_TERMS entries).
 * Falls back to Jikan then AniList name-search for string entries.
 * Caches and saves on success.
 */
async function fetchFallbackImage(cardId, cardName) {
  if (cache[cardId]) return cache[cardId];

  const term = SEARCH_TERMS[cardId];

  let url = null;

  if (typeof term === 'number') {
    // Direct AniList ID — most reliable, no name ambiguity
    url = await fetchFromAniList(term);
  } else {
    const searchName = term ?? cardName;
    // Try Jikan (MAL) first — accurate character images
    url = await fetchFromJikan(searchName);
    if (!url && searchName !== cardName) {
      url = await fetchFromJikan(cardName);
    }
    // Fall back to AniList name search
    if (!url) url = await fetchFromAniList(searchName);
  }

  if (url) {
    cache[cardId] = url;
    saveCache();
  }
  return url ?? null;
}

/**
 * Bypass the SEED/cache and fetch a fresh URL directly from AniList/Jikan.
 * Call this when a cached/SEED URL returns a 404 so we can get a working one.
 * Updates the in-memory cache and saves to disk on success.
 */
async function fetchFreshUrl(cardId, cardName) {
  const term = SEARCH_TERMS[cardId];

  let url = null;

  if (typeof term === 'number') {
    url = await fetchFromAniList(term);
  } else {
    const searchName = term ?? cardName;
    url = await fetchFromJikan(searchName);
    if (!url && searchName !== cardName) url = await fetchFromJikan(cardName);
    if (!url) url = await fetchFromAniList(searchName);
  }

  if (url) {
    cache[cardId] = url;
    saveCache();
  }
  return url ?? null;
}

/**
 * Fetch a fresh image URL using Jikan (MyAnimeList) only — no AniList.
 * Used by the image review "Find Another" button since AniList name searches
 * often return wrong characters.
 * Updates the cache on success.
 */
async function fetchJikanUrl(cardId, cardName) {
  const term = SEARCH_TERMS[cardId];
  const searchName = (typeof term === 'string' ? term : null) ?? cardName;

  let url = await fetchFromJikan(searchName);
  if (!url && searchName !== cardName) url = await fetchFromJikan(cardName);

  if (url) {
    cache[cardId] = url;
    saveCache();
  }
  return url ?? null;
}

/**
 * Manually set a specific image URL for a card, overriding cache and SEED.
 * Saves to disk immediately.
 */
function setImage(cardId, url) {
  manualOverrides[cardId] = url;
  cache[cardId] = url;
  saveOverrides();
  saveCache();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Background refresh: for every SEARCH_TERMS entry not yet cached,
 * fetch via AniList ID (numeric) or Jikan/AniList name search (string).
 * Saves after each successful fetch.
 */
async function refreshMissing() {
  const missing = Object.entries(SEARCH_TERMS).filter(([id]) => !cache[id]);
  if (missing.length === 0) {
    console.log('🖼️  Image cache: all images already cached.');
    saveCache(); // ensure SEED entries are always on disk
    return;
  }
  console.log(`🖼️  Image cache: fetching ${missing.length} missing character images...`);
  let fetched = 0;
  for (const [cardId, term] of missing) {
    let url = null;
    if (typeof term === 'number') {
      url = await fetchFromAniList(term);
    } else {
      url = await fetchFromJikan(term);
      if (!url) url = await fetchFromAniList(term);
    }
    if (url) {
      cache[cardId] = url;
      fetched++;
    }
    await sleep(400);
  }
  saveCache();
  console.log(`🖼️  Image cache: fetched ${fetched}/${missing.length} images. Cache saved.`);
}

loadOverrides();
loadCache();

module.exports = { getImage, setImage, refreshMissing, fetchFallbackImage, fetchFreshUrl, fetchJikanUrl };
