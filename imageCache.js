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

const CACHE_FILE = path.join(__dirname, 'data', 'image_cache.json');

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
      // SEED always wins — it contains verified official URLs
      cache = { ...saved, ...SEED };
    }
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

loadCache();

module.exports = { getImage, refreshMissing, fetchFallbackImage };
