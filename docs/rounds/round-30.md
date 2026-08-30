---
type: round-ledger
status: current
area: rounds/30
canonical: false
last-reviewed: 2026-08-30
---

# Round 30 – an intermediate round, 15 items + CI (30.08.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open · `[?]` his ·
`[!]` REOPENED.

**His words: «вот еще промежуточный раунд в догонку к 29му».** So it is its own round, and it ships
on **the same branch** – his standing instruction «докидывай в 29 раунд в гите всё скопом».

⚠ Several items are REGRESSIONS from round 29's own work, played and found within hours. They are
marked `[!]` and each names what shipped and why it missed – that is the point of the mark.

---

- [!] **1. «Поправить результаты недели после чемпионата, вернуть все цифры и надписи как было**:
  Income / Spent / Balance, ниже her cut **без жирного шрифта**, ниже coach's cut если есть результат.
  Всё остальное лишнее, дублирующее и сбивает с толку. **Other income странно звучит**, можно
  переименовать… например Family income и тогда эту строчку тоже оставить здесь» – ⚠⚠ **REOPENED
  against round 29 part-two #1.** He asked for one prize figure so the rows add up; the fix shipped
  five rows (`Before her cut` / `Her cut` / `Other income` / `Spent` / `Balance`) and **that is more
  than he wanted, not less**. Restore the three-row shape, her cut unbolded beneath it, the coach's
  cut when there is a result, and rename `Other income` → `Family income`.

  ⭐ And his own extension: «если она на самокоучинге, то это тоже актуальная строчка по аналогии
  с тренером» – a self-coached family still owes itself the line.

- [!] **2. «Если выбрать Do both для съёмок и турнира, то в расписании не отображаются съёмки»** –
  ⚠⚠ **REOPENED against round 29 #3.** The four-way clash shipped; its «do both» arm charges the
  7 condition and **draws nothing**. The same «you paid and cannot see it» shape a third time.

- [!] **3. «Странная серая нечитаемая надпись над кнопками… Quiet stretch ahead… Идея хорошая,
  реализация не очень. Нам в это время приходят письма и идёт запись на новые турниры – давай вообще
  эту кнопку про 6 недель уберём. Её можно оставить только на длинные травмы и с обязательным правилом
  "минус 1 день от длины окна" – иначе даже на турниры не записаться никак. Плохой паттерн»** –
  ⚙ **RULING, and it overturns my own standing decision.** I kept the control repaired and said
  deleting stays available; he has now looked at it in play and deleted it. **The multi-week skip goes
  except for a long layoff, and there it must stop one day SHORT of the window.**

- [!] **4. «В Family budget вкладка This season изменилась на So far. Я это не просил. Верни как было
  пожалуйста и запрети на уровне документации и спек агентам самовольно изменять вординг»** –
  ⚠⚠ **REOPENED, and it is a HOUSE-LAW item, not only a string.** Round 29's folded-in fix for round
  27 #8 renamed the tab while solving a different complaint. **Restore `This season`, and write the
  prohibition into `CLAUDE.md`**: an agent may not change user-facing wording it was not asked to
  change, even while fixing something adjacent.

- [ ] **5. «Внутри Bills и Shop сделать дополнительные вкладки как на экране Spending (12 weeks/So far)
  для каждой категории.** Для Bills – Her Kit / Advs Portfolio. Для Shop – сверху плашкой **The shelf**,
  ниже в ряд **Invest / Cars / Property / Business (Academy is subdivision inside) / Water / Air**.
  Для каждой карточки свой арт, карточки лежат **без общей подложки**, примерно как на экране Season» –
  **build.** ⚠ Art is his; use the documented fallback.

- [ ] **6. «Переделать экран при нажатии на плашку Next tournament на Home** – убрать рамку, картинку
  турнира квадратной (по примеру главной), часть описания на картинке, часть ниже… The read можно на
  картинке, раунды отдельной плашкой ниже на всю ширину с отступами, погоду и поездку тоже на картинку,
  4 иконки под картинкой просто в ряд без плашки, план тренировок внизу остаётся как есть» – **build.**
  ⚠ Round 29 part-two #8 built this panel by reusing the tournament splash; this is its redesign.

- [ ] **7. «Что-то не так с попапом "теперь каждый год начиная с 29 лет" – звучит как механический
  приговор безысходности пока что, надо что-то с этим сделать»** – **build (copy).** ⭐ The mechanic is
  the retirement corridor and it is correct; what is wrong is that it reads as a sentence passed rather
  than a fact about age.

- [ ] **8. «Merch brand давай предложим пользователю несколько вариантов именования при покупке…
  один из вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов
  по дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией»** – **build.**

- [ ] **9. «сам Merch brand тоже вполне может расти в цене как бизнес по какой-то логике, похожей на
  привязку к её рекламе и результатам. Можно провести анализ доходов и стоимости бренда RF (Roger
  Federer) для референса»** – **research, then build.** The brand becomes an asset with a VALUE, not
  only an income line.

- [ ] **10. «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно
  предложить уже существующее название бренда (если он есть) или снова "ввести своё"»** – **build**,
  with 8.

- [ ] **11. «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что оно
  обесценивается, а это вроде бы не совсем так»** – **build (copy).** ⚠ Check what the engine actually
  does to that asset before rewording – if it really does hold value, the words are wrong; if it
  depreciates, the words are right and the DESIGN is the surprise.

- [~] **12. «На 30 лет снова "один день вместе" =) давно не было, но я ещё понаблюдаю»** – ⚙ **his own
  hold.** Round 27 #7 shipped a one-birthday cooldown on the VOICE (longest run 4 → 1, share 30% → 24%);
  a recurrence at a 30-year gap is inside that. He is watching. Nothing to build.

- [ ] **13. «Почему-то merch brand приносил 600+, а через несколько месяцев стал 500+, хотя позиция в
  таблице уже 15»** – **measure.** ⚠ Merch income follows FAME, and fame DECAYS (halves over 104 weeks
  by design). A rising rank with a falling fame stock is possible and may be correct – but it may also
  be the decay outrunning what play can add. Measure before touching.

- [ ] **14. ⚠⚠ «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15… И надо
  логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут возможность расти на горизонте
  и будут давать разные точки входа, как в жизни. Стоимость активов будет рассчитываться исходя из
  стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл
  на пике при цене 7-8к и увидел просадку – имеешь возможность усредниться или зафиксировать убыток»** –
  ⚙ **RULING, and it replaces the model shipped hours ago.** Units, not a ratio: a unit PRICE the
  market moves, holdings measured in units bought at the price of their day. ⭐ That is what makes
  averaging down a real move rather than a feeling. And the volatility comes down.

- [ ] **15. «Для машин вполне можно ввести годовую стоимость обслуживания, которая может с каждым годом
  немного расти, как в реальности, пока стоимость авто на рынке падает»** – **build.**

- [ ] **16. CI: the build is 18m32s and the shape is measured.** `npm test` is **15m08s of it** –
  `bulk` 501 s then **eleven heavy files strictly serially, 406 s**, so for 406 s of every run half the
  runner is idle by construction (`scripts/units.mjs` loops `spawnSync`). `npm ci` is **6 s**, so extra
  jobs are nearly free. ⭐ Three jobs – bulk · the heavy shards · component+types+build+static – put the
  wall at **~9-10 min**; splitting `bulk` itself with vitest's `--shard` reaches ~7-8. ⚠ Parallelising
  the heavy files INSIDE one job is the one thing not to do: separate processes exist because of
  birpc's stalls under contention.
