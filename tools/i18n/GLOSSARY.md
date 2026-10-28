# Vạn Kiếp Luân Hồi - English translation guide

The game is a pixel-art xianxia life-sim: each life you are reborn with a random fate, years pass on their own, you make choices in events, cultivate, and eventually die and reincarnate. Players are Vietnamese wuxia/xianxia readers plus English readers of xianxia web novels.

## Voice and style
- Translate the meaning and the mood, never word by word. Write natural, punchy English the way a good xianxia web-novel translation (Wuxiaworld-style) reads: vivid, slightly archaic in dialogue, dry humor kept.
- The narrator addresses the player as "you" ("Bạn" -> "you"). Keep second person, present tense where the Vietnamese is present-ish; past tense is fine for life logs.
- Dialogue: characters can sound grand ("Insolent junior!", "Receive my move!", "Hmph!"). Keep the Vietnamese jokes, memes and sarcasm, but make them land in English (adapt idioms, do not literalise them).
- Keep it short: UI text has the same space as Vietnamese. Buttons 1-3 words. Do not add explanation that is not in the source.
- Use "-" (hyphen with spaces) where the source uses it; never use the em dash character "—".
- Numbers, + / - signs, %, emoji and symbols (★ ✓ ⚒ ⚔ › ‹ ▶ ✕ 📜) stay exactly as in the source.
- Capitalize only the first word of buttons and headings (sentence case), except proper nouns and the game terms below that are capitalized.

## Placeholders - MUST keep
- `{0}`, `{1}`, ... are code expressions (a name, a number, another phrase). Every placeholder in "vi" must appear in "en" exactly once. You may reorder them to fit English grammar.
- Do not invent new placeholders. Do not translate text inside `ph` (that is code, shown only for context).
- If a string begins or ends with a space, the English must begin or end with a space too (it joins with other text).
- Strings that are fragments ("tuổi", " · ", "kiếp ") are glued to numbers or other strings: translate as a fragment that will read well when glued (e.g. "{0} tuổi" -> "age {0}" or "{0} years old" depending on context; a lone "tuổi" after a number -> "yrs" or "years old").

## Keep as-is (do NOT translate, copy the Vietnamese exactly with diacritics)
- Personal names and name parts (surnames, given-name syllables in name lists, e.g. "Lâm", "Tô", "Huyền", "Lâm Huyền Lâm").
- Sect names used as identifiers: "Phổ Đà Sơn", "Kiếm Cốc", "Vạn Độc Môn", "Yêu Thần Điện" and other named sects/places/cities/mountains (Thanh Thủy thôn -> "Thanh Thủy Village": keep the name, translate the type word: thôn/làng = Village, trấn = Town, thành = City, núi/sơn = Mountain, động = Cave, cốc = Valley, hồ = Lake, sông = River, biển/hải = Sea).
- Region names: Bắc Mạc, Nam Cương, Đông Hải, Tuyết Vực, Ma Vực, Trung Châu... keep.
- The game title "Vạn Kiếp Luân Hồi" stays; where a subtitle helps use "Ten Thousand Rebirths".
- Usernames, "@{0}" handles.

## Cultivation realms (cảnh giới = realm)
| Vietnamese | English |
|---|---|
| Phàm Nhân / phàm nhân | Mortal |
| Luyện Khí | Qi Refining |
| Trúc Cơ | Foundation Establishment (short: Foundation) |
| Kim Đan | Golden Core |
| Nguyên Anh | Nascent Soul |
| Hóa Thần | Spirit Transformation |
| Luyện Hư | Void Refinement |
| Độ Kiếp | Tribulation Transcendence (short: Tribulation) |
| Chân Tiên | True Immortal |
| Huyền Tiên | Mystic Immortal |
| Kim Tiên | Golden Immortal |
| Đại La Kim Tiên | Daluo Golden Immortal |
| Ma giới realms (Ma ... ) | Demon ... (e.g. Ma Tôn = Demon Sovereign, Ma Đế = Demon Emperor) |
| Tiên giới / Ma giới | Immortal Realm / Demon Realm |
| tầng {0} (Luyện Khí tầng 9) | Layer {0} (Qi Refining Layer 9) |
| Sơ kỳ / Trung kỳ / Hậu kỳ | Early / Middle / Late (Golden Core Late) |
| đột phá | breakthrough / break through |
| bình cảnh | bottleneck |
| phi thăng | ascend / Ascension |
| độ kiếp, thiên kiếp, lôi kiếp | tribulation, heavenly tribulation, lightning tribulation |
| tẩu hỏa nhập ma | qi deviation |
| tâm ma | heart demon |
| bế quan | closed-door cultivation (button: Seclusion) |
| tu vi | cultivation |
| tu luyện | cultivate / Cultivation |
| tu sĩ | cultivator |
| đạo hữu | fellow Daoist |
| bần đạo | this humble Daoist |
| tiền bối / vãn bối | senior / junior |
| sư phụ / đồ đệ / sư huynh / sư tỷ / sư đệ / sư muội | Master / disciple / senior brother / senior sister / junior brother / junior sister |
| chưởng môn | Sect Leader |
| tông môn, môn phái | sect |

## Paths (con đường tu luyện = Path)
| Kiếm tu | Sword Cultivator (short: Sword) |
| Đan tu | Alchemist (short: Alchemy) |
| Trận tu | Formation Master (short: Formation) |
| Phật tu | Buddhist Cultivator (short: Buddhist) |
| Ma tu | Demonic Cultivator (short: Demonic) |
| Yêu tu | Yao Cultivator (short: Yao) - yêu tộc = yao race / demon beasts; yêu thú = demon beast |
| Chính / Tà / Trung lập (Đạo tâm lean) | Righteous / Evil / Neutral |
| Chính đạo / Ma đạo | the Righteous Path / the Demonic Path |

## Character, stats, resources
| Vietnamese | English |
|---|---|
| kiếp, kiếp này, kiếp sau, kiếp trước | life, this life, next life, past life |
| luân hồi | reincarnation / reincarnate (verb) ; "Vào luân hồi" = Enter the Cycle |
| đầu thai | be reborn / Rebirth (button "Đầu thai" = Be reborn) |
| lá số | fate chart |
| Gieo lại | Reroll |
| thiên phú | talent |
| linh căn | spiritual root (Thiên linh căn = Heavenly Spiritual Root, Phế linh căn = Crippled Spiritual Root, Tạp linh căn = Mixed Spiritual Root) |
| mệnh / bản mệnh | destiny / natal element |
| ngũ hành: Kim Mộc Thủy Hỏa Thổ | Five Elements: Metal, Wood, Water, Fire, Earth |
| khắc / bị khắc | overcomes / is overcome (element counter) |
| thọ nguyên, thọ | lifespan |
| tuổi | age / years old |
| Khỏe (sức khỏe) | Health (stat: Vitality) |
| Tâm (tâm cảnh) | Mind |
| Ma (ma tính) | Demonic |
| Ngộ (ngộ tính) | Insight |
| Vận (khí vận) | Luck |
| Đạo tâm | Dao Heart |
| Công / Thủ / Sinh lực | Attack / Defense / HP |
| máu | HP (in combat text: "loses 12 HP") |
| nội lực, chân khí | inner force, true qi |
| linh thạch | spirit stones |
| phúc duyên (phúc) | Fortune (meta currency carried across lives; "+10 phúc" = "+10 Fortune") |
| nghiệp lực (nghiệp) | Karma |
| Hồn lực | Soul Power |
| Hoàn Hồn Đan, Tụ Hồn Đan, Dưỡng Hồn Đan | Soul Return Pill, Soul Gathering Pill, Soul Nurturing Pill |
| đan dược, đan | pill(s), elixir |
| canh Mạnh Bà | Meng Po's soup |
| Kiếp Số | Calamity Count |
| kiếp tích | Calamity Scars |
| tinh thiết | refined iron |
| phân giải | Dismantle |
| lò rèn, rèn, gõ búa | forge, Forge, Strike |
| trang bị: Áo / Vũ khí / Phụ kiện | Robe / Weapon / Accessory |
| Túi đồ | Inventory |
| Phường thị | Market |
| thần binh | divine weapon |
| thú cưng, linh thú | pet, spirit beast |
| đạo lữ | Dao companion |
| huynh đệ kết nghĩa | sworn brother |
| kỳ ngộ | fortuitous encounter |
| tiên duyên | immortal affinity |
| Trọng tâm: Tu luyện, Luyện đan, Du ngoạn, Kiếm tiền, Kết duyên, Trừ yêu, Bế quan | Focus: Cultivate, Alchemy, Wander, Earn money, Romance, Hunt demons, Seclusion |
| Thiên Đạo | the Heavenly Dao |
| Thiên thư | Heavenly Tome |
| kết cục | ending |

## Game features and screens
| Vietnamese | English |
|---|---|
| Lôi đài | Arena |
| Lôi đài Phi Kiếm | Flying Sword Arena |
| phi kiếm | flying sword(s) |
| Ra đài | Enter the arena |
| Báo thù | Revenge |
| ma đầu (bóng thành ma đầu) | demon lord (your shadow becomes a demon lord) |
| bóng (bóng của người chơi) | shadow |
| Hạ chiến thư | Issue a challenge |
| Bảng xếp hạng | Leaderboard |
| Nghĩa trang tu sĩ | Cultivators' Cemetery |
| bia, bia mộ, lập bia | tombstone, epitaph, raise a tombstone |
| thắp hương | burn incense |
| Sổ Sinh Tử | Book of Life and Death |
| Gia phả | Family chronicle |
| Góp ý tính năng | Feature requests |
| Cáo thị giang hồ | Jianghu Proclamation |
| Lịch sử cập nhật | Update history |
| Tác giả hình ảnh | Art credits |
| Điểm danh | Daily check-in |
| Nhiệm vụ | Quests |
| Khoe | Show off / Share |
| Thẻ Một đời | Life Card |
| giang hồ | jianghu (the martial world) - or "the world" when plain English reads better |
| Mời tác giả một chén ngộ đạo trà | Treat the author to a cup of Enlightenment Tea |
| Ghi danh | Register (your name in the records) |
| Chơi thử | Play as guest |
| Đăng nhập / Đăng ký / Đăng xuất | Log in / Sign up / Log out |

## Output
Fill only the "en" field of each item. Keep the JSON valid (escape quotes and backslashes). Do not change "vi" or "ph". Never leave "en" empty: if something truly must stay Vietnamese (a name list entry), copy "vi" into "en".
