---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10J – Parent who hears her better: card headings

These are the optional `MET_HEADING_HEARD` and `ENDED_HEADING_HEARD` variants in
`src/engine/world/lifeBeat.ts`. They are the parent's interpretation, not extra dialogue from
the daughter. The translation must not turn a remembered habit into a claim that she said
something new this week. All lines are `DRAFT`.

## 1. Someone new – `MET_HEADING_HEARD`

| voice/read | English source | Russian draft |
| --- | --- | --- |
| sunny/open | `There is someone, and there is no ask hidden in it – she does not mind who knows` | `У неё кое-кто появился. Скрытой просьбы нет: она не против, если другие узнают` |
| sunny/private | `There is someone, and the ask is the part she leaves out – she wants it kept between us` | `У неё кое-кто появился. О просьбе она не сказала прямо, но хочет, чтобы это осталось между нами` |
| fiery/open | `There is someone, and she has drawn no line round it – she does not mind who knows` | `У неё кое-кто появился. Она не обвела новость границей: пусть знают` |
| fiery/private | `There is someone, and she has drawn a line round it – she wants it to go no further` | `У неё кое-кто появился. Границу она обозначила: дальше нас новость не пойдёт` |
| quiet/open | `There is someone, and it is not a thing she is keeping – it can be ordinary news` | `У неё кое-кто появился. Это не тайна: о таком можно говорить как об обычной новости` |
| quiet/private | `There is someone, and it is to stay where it is – with us, and no further` | `У неё кое-кто появился. Пока это останется у нас, дальше не пойдёт` |
| deep/open | `There is someone, and that is the whole of it – she is not asking us to keep anything` | `У неё кое-кто появился. Она сказала ровно это и не просит хранить тайну` |
| deep/private | `There is someone, and it is hers to keep – never ours to pass on` | `У неё кое-кто появился. Это её новость; передавать её дальше не нам` |

`fiery/open`'s `пусть знают` is a voice-specific clipped cadence, not permission to publish
private identifying details. No heading claims a partner's name, gender, or meeting date.

## 2. Relationship ending – `ENDED_HEADING_HEARD`

The `told-now` prefix means the relationship was already known; `told-late` means both its
existence and end are news. `space` and `company` remain readings of what she wants, not
buttons recommending a matching response.

| voice/register/read | English source | Russian draft |
| --- | --- | --- |
| sunny/told-now/space | `It is over. Being alright comes first with her, and the asking after – she wants the room to herself` | `Всё закончилось. Она обычно сначала говорит, что справится, а потом уже просит места для себя — сейчас ей хочется побыть одной` |
| sunny/told-now/company | `It is over. Being alright comes first with her, and the asking after – she does not want to be on her own with it` | `Всё закончилось. Она обычно сначала говорит, что справится, а потом уже просит о близости — сейчас ей не хочется быть с этим одной` |
| sunny/told-late/space | `There was someone and it is already over. With her the alright comes first – she wants the room to herself` | `В её жизни кое-кто был, но теперь всё закончилось. Её привычное «я справлюсь» не отменяет того, что сейчас ей хочется побыть одной` |
| sunny/told-late/company | `There was someone and it is already over. With her the alright comes first – she does not want to be on her own with it` | `В её жизни кое-кто был, но теперь всё закончилось. Её привычное «я справлюсь» не отменяет того, что сейчас ей не хочется быть с этим одной` |
| fiery/told-now/space | `It is over. A subject shut fast is shut with her – she wants the room to herself` | `Всё закончилось. Если она закрыла тему, то закрыла: сейчас ей хочется побыть одной` |
| fiery/told-now/company | `It is over. A subject shut fast is not a door shut, with her – she does not want to be on her own with it` | `Всё закончилось. Она быстро закрывает тему, но не дверь: сейчас ей не хочется быть с этим одной` |
| fiery/told-late/space | `There was someone and it is already over. A shut subject is shut with her – she wants the room to herself` | `В её жизни кое-кто был, но теперь всё закончилось. С ней закрытая тема обычно и остаётся закрытой; сейчас ей хочется побыть одной` |
| fiery/told-late/company | `There was someone and it is already over. A shut subject is not a shut door with her – she does not want to be on her own with it` | `В её жизни кое-кто был, но теперь всё закончилось. Закрытая тема у неё не означает закрытой двери: ей не хочется быть с этим одной` |
| quiet/told-now/space | `It is over. The arrangements are where she puts herself – and what she wants is the room to herself` | `Всё закончилось. Она обычно первым делом берётся за дела, но сейчас ей хочется побыть одной` |
| quiet/told-now/company | `It is over. The arrangements are where she puts herself – and what she wants is somebody in the room` | `Всё закончилось. Она обычно первым делом берётся за дела, но сейчас ей нужно, чтобы кто-то был рядом` |
| quiet/told-late/space | `There was someone and it is already over. The arrangements always come first with her – she wants the room to herself` | `В её жизни кое-кто был, но теперь всё закончилось. Она обычно начинает с дел; сейчас ей хочется побыть одной` |
| quiet/told-late/company | `There was someone and it is already over. The arrangements always come first with her – she wants somebody in the room` | `В её жизни кое-кто был, но теперь всё закончилось. Она обычно начинает с дел; сейчас ей нужно, чтобы кто-то был рядом` |
| deep/told-now/space | `It is over. With her the size of a thing is never the size of the words – she wants the room to herself` | `Всё закончилось. По числу её слов не понять, насколько это велико для неё. Сейчас ей хочется побыть одной` |
| deep/told-now/company | `It is over. With her the size of a thing is never the size of the words – she does not want to be on her own with it` | `Всё закончилось. По числу её слов не понять, насколько это велико для неё. Сейчас ей не хочется быть с этим одной` |
| deep/told-late/space | `There was someone and it is already over. Few words are not a small thing with her – she wants the room to herself` | `В её жизни кое-кто был, но теперь всё закончилось. Её немногословие не значит, что это мелочь. Сейчас ей хочется побыть одной` |
| deep/told-late/company | `There was someone and it is already over. Few words are not a small thing with her – she wants somebody in the room` | `В её жизни кое-кто был, но теперь всё закончилось. Её немногословие не значит, что это мелочь. Сейчас ей нужно, чтобы кто-то был рядом` |

The sunny `told-now` pair is intentionally about her usual sequencing, not a claim that she
made a fresh request this week. The quiet pair uses practical tasks as a temperament reading,
not proof that a particular arrangement has been booked. The deep pair does not grade the
amount of grief from her word count.
