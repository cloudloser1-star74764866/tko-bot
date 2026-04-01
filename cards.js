// ============================================================
//  test BOT — CARD POOL
//  Add your own cards here! Format:
//  { id: 'unique_id', name: 'Character Name', series: 'Series',
//    rarity: 'R/E/L/MY/UR/LT', desc: 'Flavour text' }
//  Images are managed by imageCache.js (auto-fetched from AniList).
// ============================================================

const { PULL_RATES } = require('./config');

const CARDS = [

  // ── Rare (R) ──────────────────────────────────────────────
  { id: 'naruto_r',         name: 'Naruto Uzumaki',          series: 'Naruto',                            rarity: 'R',  desc: 'The unpredictable ninja of the Hidden Leaf.' },
  { id: 'goku_r',           name: 'Goku',                    series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'A pure-hearted Saiyan warrior.' },
  { id: 'luffy_r',          name: 'Monkey D. Luffy',         series: 'One Piece',                         rarity: 'R',  desc: 'Future King of the Pirates.' },
  { id: 'ichigo_r',         name: 'Ichigo Kurosaki',         series: 'Bleach',                            rarity: 'R',  desc: 'A Soul Reaper protecting the living world.' },
  { id: 'deku_r',           name: 'Izuku Midoriya',          series: 'My Hero Academia',                  rarity: 'R',  desc: 'The successor of One For All.' },
  { id: 'link_r',           name: 'Link',                    series: 'The Legend of Zelda',               rarity: 'R',  desc: 'The Hero of Time, chosen by the Triforce.' },
  { id: 'cloud_r',          name: 'Cloud Strife',            series: 'Final Fantasy VII',                 rarity: 'R',  desc: 'Ex-SOLDIER turned mercenary.' },
  { id: 'eren_r',           name: 'Eren Yeager',             series: 'Attack on Titan',                   rarity: 'R',  desc: 'A boy who swore to destroy the Titans.' },
  { id: 'pikachu_r',        name: 'Pikachu',                 series: 'Pokémon',                           rarity: 'R',  desc: 'The iconic Electric-type partner.' },
  { id: 'spike_r',          name: 'Spike Spiegel',           series: 'Cowboy Bebop',                      rarity: 'R',  desc: 'A bounty hunter drifting through space.' },
  // Bleach
  { id: 'rukia_r',          name: 'Rukia Kuchiki',           series: 'Bleach',                            rarity: 'R',  desc: 'A Soul Reaper who changed Ichigo\'s fate forever.' },
  { id: 'renji_r',          name: 'Renji Abarai',            series: 'Bleach',                            rarity: 'R',  desc: 'A hot-headed lieutenant with a serpent zanpakuto.' },
  { id: 'uryu_r',           name: 'Uryu Ishida',             series: 'Bleach',                            rarity: 'R',  desc: 'The last Quincy, cold and precise.' },
  { id: 'orihime_r',        name: 'Orihime Inoue',           series: 'Bleach',                            rarity: 'R',  desc: 'Her Shun Shun Rikka can reject reality itself.' },
  { id: 'chad_r',           name: 'Yasutora Sado',           series: 'Bleach',                            rarity: 'R',  desc: 'A gentle giant who fights only to protect others.' },
  // JoJo's Bizarre Adventure
  { id: 'joseph_r',         name: 'Joseph Joestar',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'Your next line is… "I knew you\'d say that!"' },
  { id: 'caesar_r',         name: 'Caesar Zeppeli',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'A Hamon warrior of fierce elegance.' },
  { id: 'noriaki_r',        name: 'Noriaki Kakyoin',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'Hierophant Green\'s loyal user.' },
  // One Piece
  { id: 'nami_r',           name: 'Nami',                    series: 'One Piece',                         rarity: 'R',  desc: 'Navigator of the Straw Hats, lover of treasure.' },
  { id: 'usopp_r',          name: 'Usopp',                   series: 'One Piece',                         rarity: 'R',  desc: 'Brave warrior of the sea — when he needs to be.' },
  { id: 'chopper_r',        name: 'Tony Tony Chopper',       series: 'One Piece',                         rarity: 'R',  desc: 'A reindeer doctor with a Devil Fruit of many forms.' },
  { id: 'sanji_r',          name: 'Sanji',                   series: 'One Piece',                         rarity: 'R',  desc: 'A chef whose kicks blaze like a black flame.' },
  { id: 'robin_r',          name: 'Nico Robin',              series: 'One Piece',                         rarity: 'R',  desc: 'Archaeologist who can read the Poneglyphs.' },
  // Black Clover
  { id: 'asta_r',           name: 'Asta',                    series: 'Black Clover',                      rarity: 'R',  desc: 'A boy born without magic who never gives up.' },
  { id: 'noelle_r',         name: 'Noelle Silva',            series: 'Black Clover',                      rarity: 'R',  desc: 'Royal mage of the Black Bulls with water magic.' },
  { id: 'yuno_r',           name: 'Yuno',                    series: 'Black Clover',                      rarity: 'R',  desc: 'Asta\'s rival, wielder of wind and star magic.' },
  // Demon Slayer
  { id: 'tanjiro_r',        name: 'Tanjiro Kamado',          series: 'Demon Slayer',                      rarity: 'R',  desc: 'A kind-hearted demon slayer with the Hinokami Kagura.' },
  { id: 'nezuko_r',         name: 'Nezuko Kamado',           series: 'Demon Slayer',                      rarity: 'R',  desc: 'A demon who still protects humans with fierce love.' },
  { id: 'zenitsu_r',        name: 'Zenitsu Agatsuma',        series: 'Demon Slayer',                      rarity: 'R',  desc: 'Terrified of everything — until he falls asleep.' },
  { id: 'inosuke_r',        name: 'Inosuke Hashibira',       series: 'Demon Slayer',                      rarity: 'R',  desc: 'Wild boar-masked warrior raised in the mountains.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'edward_r',         name: 'Edward Elric',            series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'The Fullmetal Alchemist, short in stature, towering in will.' },
  { id: 'alphonse_r',       name: 'Alphonse Elric',          series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'A gentle soul sealed inside a suit of armour.' },
  { id: 'winry_r',          name: 'Winry Rockbell',          series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'Mechanic genius and the heart of the Elric brothers.' },
  // Sword Art Online
  { id: 'kirito_r',         name: 'Kirito',                  series: 'Sword Art Online',                  rarity: 'R',  desc: 'The Black Swordsman of Aincrad.' },
  { id: 'asuna_r',          name: 'Asuna',                   series: 'Sword Art Online',                  rarity: 'R',  desc: 'Lightning Flash, the fastest blade in SAO.' },
  // Jujutsu Kaisen
  { id: 'itadori_r',        name: 'Yuji Itadori',            series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Host of Ryomen Sukuna, fighting for a proper death.' },
  { id: 'nobara_r',         name: 'Nobara Kugisaki',         series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Straw doll technique — don\'t underestimate her.' },
  // Fairy Tail
  { id: 'natsu_r',          name: 'Natsu Dragneel',          series: 'Fairy Tail',                        rarity: 'R',  desc: 'The Fire Dragon Slayer of Fairy Tail.' },
  { id: 'gray_r',           name: 'Gray Fullbuster',         series: 'Fairy Tail',                        rarity: 'R',  desc: 'An ice mage who keeps losing his clothes.' },
  { id: 'erza_r',           name: 'Erza Scarlet',            series: 'Fairy Tail',                        rarity: 'R',  desc: 'Titania the Fairy Queen, requipping armour mid-battle.' },
  // Death Note
  { id: 'light_r',          name: 'Light Yagami',            series: 'Death Note',                        rarity: 'R',  desc: 'I am justice. I am the god of the new world.' },
  { id: 'l_r',              name: 'L Lawliet',               series: 'Death Note',                        rarity: 'R',  desc: 'The world\'s greatest detective — sitting oddly.' },
  // Mob Psycho 100
  { id: 'mob_r',            name: 'Shigeo Kageyama',         series: 'Mob Psycho 100',                    rarity: 'R',  desc: 'A boy suppressing psychic power that shakes the earth.' },
  { id: 'reigen_r',         name: 'Reigen Arataka',          series: 'Mob Psycho 100',                    rarity: 'R',  desc: 'Greatest psychic of the century — citation needed.' },
  // Hunter x Hunter
  { id: 'gon_r',            name: 'Gon Freecss',             series: 'Hunter x Hunter',                   rarity: 'R',  desc: 'An innocent boy with limitless hidden potential.' },
  { id: 'kurapika_r',       name: 'Kurapika',                series: 'Hunter x Hunter',                   rarity: 'R',  desc: 'A Kurta survivor driven by vengeance.' },
  // Chainsaw Man
  { id: 'denji_r',          name: 'Denji',                   series: 'Chainsaw Man',                      rarity: 'R',  desc: 'A devil hunter with a chainsaw heart.' },
  { id: 'power_r',          name: 'Power',                   series: 'Chainsaw Man',                      rarity: 'R',  desc: 'Blood Fiend and certified chaotic ally.' },
  // Spy x Family
  { id: 'loid_r',           name: 'Loid Forger',             series: 'Spy x Family',                      rarity: 'R',  desc: 'Spy Twilight, master of disguise and fake fatherhood.' },
  { id: 'yor_r',            name: 'Yor Forger',              series: 'Spy x Family',                      rarity: 'R',  desc: 'An assassin who genuinely tries her best at cooking.' },
  { id: 'anya_r',           name: 'Anya Forger',             series: 'Spy x Family',                      rarity: 'R',  desc: 'A telepath who just wants her family to stay together.' },
  // Re:Zero
  { id: 'subaru_r',         name: 'Subaru Natsuki',          series: 'Re:Zero',                           rarity: 'R',  desc: 'An ordinary teen who dies repeatedly to save others.' },
  { id: 'emilia_r',         name: 'Emilia',                  series: 'Re:Zero',                           rarity: 'R',  desc: 'A half-elf candidate for the royal throne.' },
  // Gintama
  { id: 'gintoki_r',        name: 'Gintoki Sakata',          series: 'Gintama',                           rarity: 'R',  desc: 'The White Demon, now running an odd-jobs business.' },
  // Inuyasha
  { id: 'inuyasha_r',       name: 'Inuyasha',                series: 'Inuyasha',                          rarity: 'R',  desc: 'Half-demon with the Tessaiga, caught between two worlds.' },
  // Steins;Gate
  { id: 'okabe_r',          name: 'Rintaro Okabe',           series: 'Steins;Gate',                       rarity: 'R',  desc: 'Mad scientist — El Psy Kongroo.' },
  // Yu Yu Hakusho
  { id: 'yusuke_r',         name: 'Yusuke Urameshi',         series: 'Yu Yu Hakusho',                     rarity: 'R',  desc: 'A delinquent who died saving a kid and became a Spirit Detective.' },
  // Overlord
  { id: 'albedo_e',         name: 'Albedo',                  series: 'Overlord',                          rarity: 'E',  desc: 'Guardian Overseer of Nazarick, devoted to Ainz without question.' },
  // Death Note
  { id: 'near_l',           name: 'Near',                    series: 'Death Note',                        rarity: 'L',  desc: 'L\'s true successor — he cornered Kira with logic and toys.' },

  // ── Epic (E) ──────────────────────────────────────────────
  { id: 'sasuke_e',         name: 'Sasuke Uchiha',           series: 'Naruto',                            rarity: 'E',  desc: 'Last survivor of the Uchiha clan.' },
  { id: 'vegeta_e',         name: 'Vegeta',                  series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'The proud Prince of all Saiyans.' },
  { id: 'zoro_e',           name: 'Roronoa Zoro',            series: 'One Piece',                         rarity: 'E',  desc: 'Swordsman aiming to be the world\'s greatest.' },
  { id: 'bakugo_e',         name: 'Katsuki Bakugo',          series: 'My Hero Academia',                  rarity: 'E',  desc: 'Explosive hero with a fiery spirit.' },
  { id: 'levi_e',           name: 'Levi Ackerman',           series: 'Attack on Titan',                   rarity: 'E',  desc: 'Humanity\'s strongest soldier.' },
  { id: 'kratos_e',         name: 'Kratos',                  series: 'God of War',                        rarity: 'E',  desc: 'The Ghost of Sparta, slayer of gods.' },
  { id: 'sephiroth_e',      name: 'Sephiroth',               series: 'Final Fantasy VII',                 rarity: 'E',  desc: 'A legendary SOLDIER turned destroyer.' },
  { id: 'killua_e',         name: 'Killua Zoldyck',          series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'An assassin heir with lightning reflexes.' },
  // Bleach
  { id: 'byakuya_e',        name: 'Byakuya Kuchiki',         series: 'Bleach',                            rarity: 'E',  desc: 'Pride and petals — the captain of the 6th Division.' },
  { id: 'grimmjow_e',       name: 'Grimmjow Jaegerjaquez',   series: 'Bleach',                            rarity: 'E',  desc: 'Sixth Espada. Chaos given form.' },
  { id: 'ulquiorra_e',      name: 'Ulquiorra Cifer',         series: 'Bleach',                            rarity: 'E',  desc: 'Fourth Espada. Nihilism made flesh.' },
  // JoJo's Bizarre Adventure
  { id: 'jotaro_e',         name: 'Jotaro Kujo',             series: 'JoJo\'s Bizarre Adventure',         rarity: 'E',  desc: 'Yare yare daze. Star Platinum: The World.' },
  { id: 'giorno_e',         name: 'Giorno Giovanna',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'E',  desc: 'I, Giorno Giovanna, have a dream.' },
  { id: 'josuke_e',         name: 'Josuke Higashikata',      series: 'JoJo\'s Bizarre Adventure',         rarity: 'E',  desc: 'Don\'t insult the hair. Crazy Diamond will fix that.' },
  // One Piece
  { id: 'ace_e',            name: 'Portgas D. Ace',          series: 'One Piece',                         rarity: 'E',  desc: 'Fire Fist Ace — Whitebeard\'s beloved son.' },
  { id: 'law_e',            name: 'Trafalgar D. Water Law',  series: 'One Piece',                         rarity: 'E',  desc: 'The Surgeon of Death and his ROOM ability.' },
  { id: 'kid_e',            name: 'Eustass Kid',             series: 'One Piece',                         rarity: 'E',  desc: 'A magnetic supernova with a reckless streak.' },
  // Black Clover
  { id: 'yami_e',           name: 'Yami Sukehiro',           series: 'Black Clover',                      rarity: 'E',  desc: 'Dark magic captain who exceeds his limits daily.' },
  { id: 'julius_e',         name: 'Julius Novachrono',       series: 'Black Clover',                      rarity: 'E',  desc: 'The Wizard King, obsessed with new magic.' },
  // Demon Slayer
  { id: 'rengoku_e',        name: 'Kyojuro Rengoku',         series: 'Demon Slayer',                      rarity: 'E',  desc: 'Flame Hashira. Set your heart ablaze!' },
  { id: 'tengen_e',         name: 'Tengen Uzui',             series: 'Demon Slayer',                      rarity: 'E',  desc: 'Sound Hashira. Flamboyant by choice, lethal by skill.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'roy_e',            name: 'Roy Mustang',             series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'The Flame Alchemist aiming for the top.' },
  { id: 'armstrong_e',      name: 'Alex Louis Armstrong',    series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'Strong-arm Alchemist — and proud of it.' },
  // Jujutsu Kaisen
  { id: 'gojo_e',           name: 'Satoru Gojo',             series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'The strongest — Infinity in the palm of his hand.' },
  { id: 'todo_e',           name: 'Aoi Todo',                series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'What\'s your type? Boogie Woogie!' },
  // Fairy Tail
  { id: 'laxus_e',          name: 'Laxus Dreyar',            series: 'Fairy Tail',                        rarity: 'E',  desc: 'Lightning Dragon Slayer and Fairy Tail\'s thunder god.' },
  { id: 'gildarts_e',       name: 'Gildarts Clive',          series: 'Fairy Tail',                        rarity: 'E',  desc: 'Fairy Tail\'s ace, whose Crush magic breaks anything.' },
  // Yu Yu Hakusho
  { id: 'hiei_e',           name: 'Hiei',                    series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'The Forbidden Child, wielder of the Dragon of the Darkness Flame.' },
  { id: 'kurama_e',         name: 'Kurama',                  series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'A fox demon reborn — his Rose Whip is merciless.' },
  // Re:Zero
  { id: 'rem_e',            name: 'Rem',                     series: 'Re:Zero',                           rarity: 'E',  desc: 'A demon maid who loves with her whole heart.' },
  // Seven Deadly Sins
  { id: 'ban_e',            name: 'Ban',                     series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'The Undead Fox\'s Sin of Greed.' },
  // Vinland Saga
  { id: 'thorfinn_e',       name: 'Thorfinn',                series: 'Vinland Saga',                      rarity: 'E',  desc: 'A boy forged by war who chose to lay down his blade.' },
  { id: 'askeladd_e',       name: 'Askeladd',                series: 'Vinland Saga',                      rarity: 'E',  desc: 'A cunning chieftain who plays every side.' },
  // Code Geass
  { id: 'lelouch_e',        name: 'Lelouch vi Britannia',    series: 'Code Geass',                        rarity: 'E',  desc: 'Zero — the chess master who bet the world.' },
  // Gurren Lagann
  { id: 'kamina_e',         name: 'Kamina',                  series: 'Gurren Lagann',                     rarity: 'E',  desc: 'Believe in the me who believes in you!' },
  // Chainsaw Man
  { id: 'makima_e',         name: 'Makima',                  series: 'Chainsaw Man',                      rarity: 'E',  desc: 'Control Devil in disguise. Everything bows to her.' },
  // Black Butler
  { id: 'sebastian_e',      name: 'Sebastian Michaelis',     series: 'Black Butler',                      rarity: 'E',  desc: 'One hell of a butler. Demon by nature.' },

  // ── Legendary (L) ─────────────────────────────────────────
  { id: 'itachi_l',         name: 'Itachi Uchiha',           series: 'Naruto',                            rarity: 'L',  desc: 'A shinobi who bore the weight of sacrifice.' },
  { id: 'goku_ssj4_l',      name: 'Goku SSJ4',               series: 'Dragon Ball GT',                    rarity: 'L',  desc: 'The pinnacle of Saiyan transformation.' },
  { id: 'shanks_l',         name: 'Red-Hair Shanks',         series: 'One Piece',                         rarity: 'L',  desc: 'One of the Four Emperors of the Sea.' },
  { id: 'allmight_l',       name: 'All Might',               series: 'My Hero Academia',                  rarity: 'L',  desc: 'The Symbol of Peace. Plus Ultra!' },
  { id: 'genos_l',          name: 'Genos',                   series: 'One Punch Man',                     rarity: 'L',  desc: 'A cyborg hero seeking the truth of his power.' },
  { id: 'hisoka_l',         name: 'Hisoka Morow',            series: 'Hunter x Hunter',                   rarity: 'L',  desc: 'A twisted magician who lives to fight the strong.' },
  // Bleach
  { id: 'aizen_l',          name: 'Sosuke Aizen',            series: 'Bleach',                            rarity: 'L',  desc: 'Omniscient, omnipotent — and he\'s been fooling you all along.' },
  { id: 'gin_l',            name: 'Gin Ichimaru',            series: 'Bleach',                            rarity: 'L',  desc: 'A silver smile that hides the sharpest blade.' },
  // JoJo's Bizarre Adventure
  { id: 'dio_l',            name: 'Dio Brando',              series: 'JoJo\'s Bizarre Adventure',         rarity: 'L',  desc: 'WRYYY! The World stops time itself.' },
  // One Piece
  { id: 'mihawk_l',         name: 'Dracule Mihawk',          series: 'One Piece',                         rarity: 'L',  desc: 'Greatest swordsman in the world. Zoro\'s goal.' },
  // Black Clover
  { id: 'licht_l',          name: 'Licht',                   series: 'Black Clover',                      rarity: 'L',  desc: 'The first Magic Knight, carrying a nation\'s grief.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'father_l',         name: 'Father',                  series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'L',  desc: 'The dwarf in the flask who consumed a God.' },
  // Jujutsu Kaisen
  { id: 'yuta_l',           name: 'Yuta Okkotsu',            series: 'Jujutsu Kaisen',                    rarity: 'L',  desc: 'Special Grade — his cursed energy is unmatched.' },
  // Fairy Tail
  { id: 'mavis_l',          name: 'Mavis Vermillion',        series: 'Fairy Tail',                        rarity: 'L',  desc: 'First Master of Fairy Tail, the Fairy Tactician.' },
  // Hunter x Hunter
  { id: 'netero_l',         name: 'Isaac Netero',            series: 'Hunter x Hunter',                   rarity: 'L',  desc: 'The 12th Chairman — a prayer that could kill gods.' },
  // Gurren Lagann
  { id: 'simon_l',          name: 'Simon the Digger',        series: 'Gurren Lagann',                     rarity: 'L',  desc: 'From a tunnel-digging boy to the driller who pierces the heavens.' },
  // That Time I Got Reincarnated as a Slime
  { id: 'rimuru_l',         name: 'Rimuru Tempest',          series: 'That Time I Got Reincarnated as a Slime', rarity: 'L', desc: 'A slime who built a nation and became a True Demon Lord.' },

  // ── Mythical (MY) ─────────────────────────────────────────
  { id: 'madara_my',        name: 'Madara Uchiha',           series: 'Naruto',                            rarity: 'MY', desc: 'A god of shinobi with unrivalled power.' },
  { id: 'beerus_my',        name: 'Beerus',                  series: 'Dragon Ball Super',                 rarity: 'MY', desc: 'God of Destruction. Do not wake him.' },
  { id: 'whitebeard_my',    name: 'Whitebeard',              series: 'One Piece',                         rarity: 'MY', desc: 'The man who stood atop the world.' },
  { id: 'saitama_my',       name: 'Saitama',                 series: 'One Punch Man',                     rarity: 'MY', desc: 'Defeated every enemy with a single punch.' },
  { id: 'mewtwo_my',        name: 'Mewtwo',                  series: 'Pokémon',                           rarity: 'MY', desc: 'A genetically engineered Pokémon of immense psy-power.' },
  // New Mythical
  { id: 'yhwach_my',        name: 'Yhwach',                  series: 'Bleach',                            rarity: 'MY', desc: 'The Almighty — he sees and rewrites all futures.' },
  { id: 'kira_my',          name: 'Yoshikage Kira',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'MY', desc: 'All he wants is a quiet life. Killer Queen won\'t let you stop him.' },
  { id: 'kaido_my',         name: 'Kaido',                   series: 'One Piece',                         rarity: 'MY', desc: 'The world\'s strongest creature. Couldn\'t be killed.' },
  { id: 'muzan_my',         name: 'Muzan Kibutsuji',         series: 'Demon Slayer',                      rarity: 'MY', desc: 'King of Demons. The source of all evil in the night.' },
  { id: 'sukuna_my',        name: 'Ryomen Sukuna',           series: 'Jujutsu Kaisen',                    rarity: 'MY', desc: 'King of Curses — even sealed in fingers, none compare.' },
  { id: 'acnologia_my',     name: 'Acnologia',               series: 'Fairy Tail',                        rarity: 'MY', desc: 'The Black Dragon of the Apocalypse, annihilator of magic.' },
  { id: 'escanor_my',       name: 'Escanor',                 series: 'The Seven Deadly Sins',             rarity: 'MY', desc: 'The Lion\'s Sin of Pride. At noon, none can surpass him.' },

  // ── Ultra-Rare (UR) ───────────────────────────────────────
  { id: 'kaguya_ur',        name: 'Kaguya Ōtsutsuki',        series: 'Naruto',                            rarity: 'UR', desc: 'The progenitor of chakra itself.' },
  { id: 'zeno_ur',          name: 'Zeno',                    series: 'Dragon Ball Super',                 rarity: 'UR', desc: 'The Omni-King who can erase universes.' },
  { id: 'joyboy_ur',        name: 'Joy Boy',                 series: 'One Piece',                         rarity: 'UR', desc: 'A legend from the Void Century.' },
  { id: 'arceus_ur',        name: 'Arceus',                  series: 'Pokémon',                           rarity: 'UR', desc: 'The Alpha Pokémon who shaped the universe.' },
  // New Ultra-Rare
  { id: 'ichigo_bankai_ur', name: 'Ichigo (True Bankai)',    series: 'Bleach',                            rarity: 'UR', desc: 'The final convergence of Soul Reaper, Hollow, and Quincy.' },
  { id: 'blackbeard_ur',    name: 'Marshall D. Teach',       series: 'One Piece',                         rarity: 'UR', desc: 'Two Devil Fruits. Darkness swallows all, quakes shatter all.' },
  { id: 'dio_wr_ur',        name: 'DIO (The World)',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'UR', desc: 'ZA WARUDO! Time stops for him and him alone.' },

  // ── Limited (LT) ──────────────────────────────────────────
  { id: 'sage_naruto_lt',   name: 'Naruto (Six Paths Sage)', series: 'Naruto',                            rarity: 'LT', desc: 'Bestowed power by the Sage of Six Paths himself.' },
  { id: 'ultra_goku_lt',    name: 'Goku (Ultra Instinct)',   series: 'Dragon Ball Super',                 rarity: 'LT', desc: 'A state beyond the gods — pure autonomous movement.' },
  { id: 'gear5_luffy_lt',   name: 'Luffy (Gear 5)',          series: 'One Piece',                         rarity: 'LT', desc: 'The most ridiculous power in the world. Joy Boy awakened.' },
  { id: 'sukuna_fp_lt',     name: 'Sukuna (Full Power)',     series: 'Jujutsu Kaisen',                    rarity: 'LT', desc: 'Heian-era pinnacle. Cleave and Dismantle erasing existence.' },

];

/**
 * Pull a random card weighted by PULL_RATES.
 */
function pullCard() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let chosen = 'R';

  for (const [rarity, rate] of Object.entries(PULL_RATES)) {
    cumulative += rate;
    if (roll < cumulative) { chosen = rarity; break; }
  }

  const pool = CARDS.filter(c => c.rarity === chosen);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

module.exports = { CARDS, pullCard };
