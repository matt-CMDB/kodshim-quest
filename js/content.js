/* Kodshim Quest — the halachic content.
   Everything the game teaches or tests lives here, with its sources. The
   Rambam citations follow the halacha numbering of the Mishneh Torah text in
   source-material/ (Hilchos Maaseh HaKorbanos = "MK"). */
window.Content = (function () {

  // ------------------------------------------------------------------
  // Sources (Hebrew text shown in the Sefer and after answers)
  // ------------------------------------------------------------------
  const SOURCES = {
    'MK 1:1': { he: 'כָּל הַקָּרְבָּנוֹת שֶׁל מִינֵי נֶפֶשׁ חַיָּה בָּאִין מֵחֲמִשָּׁה מִינִין בִּלְבַד. מִן הַבָּקָר וּמִן הַכְּבָשִׂים וּמִן הָעִזִּים וּמִן הַתּוֹרִים וּמִן בְּנֵי הַיּוֹנָה.', en: 'All offerings of living creatures come from five species only: cattle, sheep, goats, turtledoves and young pigeons.' },
    'MK 1:2': { he: 'וְכָל הַקָּרְבָּנוֹת בֵּין שֶׁל צִבּוּר בֵּין שֶׁל יָחִיד אַרְבָּעָה מִינִין. עוֹלָה. וְחַטָּאת. וְאָשָׁם. וּשְׁלָמִים.', en: 'All offerings, communal or individual, are of four kinds: olah, chatas, asham and shelamim.' },
    'MK 1:3': { he: 'וְעוֹד יֵשׁ שָׁם שְׁלֹשָׁה מִינֵי קָרְבַּן יָחִיד וְהֵם הַפֶּסַח. וְהַבְּכוֹר. וְהַמַּעֲשֵׂר.', en: 'There are three more kinds of individual offering: the pesach, the bechor and the maaser.' },
    'MK 1:4': { he: 'כָּל קָרְבָּנוֹת הַצִּבּוּר הֵן עוֹלָה אוֹ חַטָּאת. וְאֵין בְּקָרְבְּנוֹת הַצִּבּוּר שְׁלָמִים חוּץ מִשְּׁנֵי כְּבָשִׂים הַבָּאִים עִם לֶחֶם הַתְּנוּפָה בַּעֲצֶרֶת... וְאֵין הַצִּבּוּר מַקְרִיבִין אָשָׁם לְעוֹלָם וְלֹא עוֹף.', en: 'All communal offerings are an olah or a chatas. The community brings no shelamim except the two lambs that come with the loaves on Shavuos; the community never brings an asham, nor a bird.' },
    'MK 1:8': { he: 'כָּל עוֹלַת בְּהֵמָה אֵינָהּ בָּאָה אֶלָּא מִן הַזְּכָרִים בִּלְבַד. וְהִיא בָּאָה מִן הַכְּבָשִׂים וּמִן הָעִזִּים וּמִן הַבָּקָר בֵּין גְּדוֹלִים בֵּין קְטַנִּים. וּמִן הַתּוֹרִים וּבְנֵי יוֹנָה וְאֶחָד בָּהֶן הַזָּכָר וְהַנְּקֵבָה.', en: 'An animal olah comes only from males: sheep, goats or cattle, large or small. A bird olah comes from turtledoves or young pigeons, male or female alike.' },
    'MK 1:9': { he: 'הַחַטָּאת בָּאָה מֵחֲמֵשֶׁת הַמִּינִים הָאֵלּוּ מִן הַזְּכָרִים וּמִן הַנְּקֵבוֹת מִן הַגְּדוֹלִים וּמִן הַקְּטַנִּים.', en: 'A chatas comes from all five species, male or female, large or small.' },
    'MK 1:10': { he: 'הָאָשָׁם אֵינוֹ בָּא אֶלָּא מִזִּכְרֵי כְּבָשִׂים בִּלְבַד. יֵשׁ אָשָׁם בָּא מִגְּדוֹלֵי מִין זֶה וְיֵשׁ אָשָׁם בָּא מִן הַקְּטַנִּים.', en: 'An asham comes only from male sheep. Some ashamos come from grown ones (a ram) and some from young ones (a lamb).' },
    'MK 1:11': { he: 'הַשְּׁלָמִים בָּאִים מִן הַכְּבָשִׂים וּמִן הָעִזִּים וּמִן הַבָּקָר מִזְּכָרִים וּמִנְּקֵבוֹת מִן הַגְּדוֹלִים וּמִן הַקְּטַנִּים. וְאֵין הָעוֹף בָּא שְׁלָמִים. הַקְּטַנִּים הֵם מִבֶּן שְׁמוֹנַת יָמִים עַד שָׁנָה תְּמִימָה מִיּוֹם לְיוֹם... וְהַגְּדוֹלִים בַּבָּקָר עַד שָׁלֹשׁ שָׁנִים שְׁלֵמוֹת מִיּוֹם לְיוֹם. וּבַצֹּאן עַד שְׁתֵּי שָׁנִים שְׁלֵמוֹת מִיּוֹם לְיוֹם. יוֹתֵר עַל זֶה הֲרֵי הוּא זָקֵן וְאֵין מַקְרִיבִין אוֹתוֹ.', en: 'Shelamim come from sheep, goats or cattle, male or female, large or small; no bird is brought as shelamim. "Small" is from eight days to a full year, day for day. "Large": cattle up to three full years, sheep and goats up to two full years. Older than that it is zaken and is not offered.' },
    'MK 1:12': { he: 'אַף עַל פִּי שֶׁכָּל הַקָּרְבָּנוֹת כְּשֵׁרִין מִיּוֹם הַשְּׁמִינִי וָהָלְאָה אֵין מַקְרִיבִין לְכַתְּחִלָּה אֶלָּא מִיּוֹם שְׁלֹשִׁים וָהָלְאָה. חוּץ מִן הַבְּכוֹר וּמִן הַפֶּסַח וּמִן הַמַּעֲשֵׂר.', en: 'Although every offering is valid from the eighth day on, one does not offer it lechatchilah before the thirtieth day, except the bechor, the pesach and the maaser.' },
    'MK 1:13': { he: 'שָׁעוֹת מוֹנִין לְקָדָשִׁים. וְאִם הוֹסִיפוּ שָׁעָה אַחַת אוֹ פָּחֲתוּ שָׁעָה פְּסוּלִין... אֲפִלּוּ הָיָה בֶּן שָׁנָה בִּשְׁעַת שְׁחִיטָה וְהוֹסִיף עַל הַשָּׁנָה בִּשְׁעַת זְרִיקָה נִפְסַל.', en: 'Hours are counted for kodashim: one hour over or under the window disqualifies. Even if it was within its year at shechitah but crossed the line by the time of zerikah, it is pasul.' },
    'MK 1:14': { he: 'כָּל מָקוֹם שֶׁנֶּאֱמַר בַּתּוֹרָה כֶּבֶשׂ אוֹ כַּבְשָׂה אוֹ כְּבָשִׂים הֲרֵי אֵלּוּ בְּנֵי שָׁנָה. וְכָל מָקוֹם שֶׁנֶּאֱמַר אַיִל אוֹ אֵילִים הֵם הַזְּכָרִים בְּנֵי שְׁנָתַיִם. וּמֵאֵימָתַי יִקָּרֵא אַיִל מִשֶּׁיִּכָּנֵס בְּשָׁנָה שְׁנִיָּה אֶחָד וּשְׁלֹשִׁים יוֹם. אֲבָל בְּיוֹם שְׁלֹשִׁים אֵינוֹ כָּשֵׁר לֹא לְכֶבֶשׂ וְלֹא לָאַיִל וְהוּא הַנִּקְרָא פִּלְגָּס. וְכָל מָקוֹם שֶׁנֶּאֱמַר בּוֹ עֵגֶל הֲרֵי זֶה בֶּן שָׁנָה. פַּר בֶּן שְׁתַּיִם. שְׂעִיר עִזִּים בֶּן שָׁנָה. שָׂעִיר בֶּן שְׁתַּיִם. כָּל שָׁנָה שְׁנִיָּה הוּא נִקְרָא שָׂעִיר.', en: 'Wherever the Torah says keves, kavsah or kevasim: first year. Ayil: a male in its second year, from thirty-one days into the second year. Within those thirty days it is fit neither as a keves nor as an ayil, and is called a pilgas. Egel: first year; par: second year. Se\'ir izim: first year; sa\'ir: second year, all of it.' },
    'MK 1:15': { he: 'כָּל קָרְבְּנוֹת הַצִּבּוּר זְכָרִים... כָּל חַטַּאת יָחִיד נְקֵבָה וְתֵאָכֵל לַכֹּהֲנִים וְאֵינָהּ בָּאָה מִן הַבָּקָר. חוּץ מִשָּׁלֹשׁ חַטָּאוֹת. חַטַּאת נָשִׂיא שֶׁהִיא עֵז וְנֶאֱכֶלֶת. וְחַטַּאת כֹּהֵן מָשִׁיחַ שֶׁהוּא פַּר וְנִשְׂרֶפֶת... וְהַשְּׁלִישִׁי פַּר שֶׁמֵּבִיא כֹּהֵן גָּדוֹל בְּיוֹם הַכִּפּוּרִים.', en: 'All communal offerings are male. Every individual\'s chatas is female, is eaten by the kohanim, and does not come from cattle, except three: the nasi\'s (a male goat, eaten), the kohen mashiach\'s (a bull, burned) and the kohen gadol\'s bull on Yom Kippur.' },
    'MK 1:17': { he: 'וְכָל הָעוֹלוֹת וְהַחַטָּאוֹת וְהָאֲשָׁמוֹת וּשְׁנֵי כַּבְשֵׂי שְׁלָמִים שֶׁל עֲצֶרֶת נִקְרָאִים קָדְשֵׁי קָדָשִׁים. אֲבָל שְׁלָמִים שֶׁל יָחִיד וְהַבְּכוֹר וְהַמַּעֲשֵׂר וְהַפֶּסַח נִקְרָאִים קָדָשִׁים קַלִּים.', en: 'All olos, chataos, ashamos and the two shelamim lambs of Shavuos are called kodshei kodashim; an individual\'s shelamim, the bechor, the maaser and the pesach are called kodashim kalim.' },
    'MK 1:18': { he: 'הָאֵיבָרִים שֶׁשּׂוֹרְפִין אוֹתָן עַל גַּבֵּי הַמִּזְבֵּחַ... הֵן הַנִּקְרָאִין אֵימוּרִין... הַחֵלֶב אֲשֶׁר עַל הַקֶּרֶב... וּשְׁתֵּי הַכְּלָיוֹת וְחֵלֶב שֶׁעֲלֵיהֶן עִם הַחֵלֶב אֲשֶׁר עַל הַכְּסָלִים וְיוֹתֶרֶת הַכָּבֵד... וְאִם הָיָה הַקָּרְבָּן מִמִּין הַכְּבָשִׂים מוֹסִיף עַל אֵלּוּ הָאַלְיָה תְּמִימָה.', en: 'The parts burned on the altar are called eimurin: the fat on the innards, the two kidneys with their fat and the fat on the flanks, and the lobe of the liver. If the offering is a sheep, the whole fat tail (alyah) is added.' },
    'MK 5:2': { he: 'קָדְשֵׁי קָדָשִׁים אֵין שׁוֹחֲטִין אוֹתָן וְאֵין מְקַבְּלִין אֶת דָּמָן אֶלָּא בִּצְפוֹן הַמִּזְבֵּחַ... וְקָדָשִׁים קַלִּים שְׁחִיטָתָן וְקִבּוּל דָּמָן בְּכָל מָקוֹם מִן הָעֲזָרָה.', en: 'Kodshei kodashim are slaughtered, and their blood received, only north of the altar; kodashim kalim anywhere in the Azarah.' },
    'MK 6:1': { he: 'וְכֵיצַד מַעֲשֵׂה הָעוֹלָה. שׁוֹחֵט וְזוֹרֵק הַדָּם... וּמַפְשִׁיט וּמְנַתֵּחַ וּמַקְטִיר כָּל הַנְּתָחִים עַל גַּבֵּי הַמִּזְבֵּחַ שֶׁנֶּאֱמַר "וְהִקְטִיר הַכֹּהֵן אֶת הַכֹּל הַמִּזְבֵּחָה".', en: 'The olah: slaughter, cast the blood, flay, cut into pieces and burn all the pieces on the altar, as it says "the kohen shall burn it all on the altar".' },
    'MK 10:3': { he: 'וְאֵין חַטָּאת וְאָשָׁם וּשְׁיָרֵי מְנָחוֹת נֶאֱכָלִין אֶלָּא לְזִכְרֵי כְּהֻנָּה בָּעֲזָרָה.', en: 'Chatas, asham and the remainder of menachos are eaten only by male kohanim, in the Azarah.' },
    'MK 10:5': { he: 'וְכֻלָּן נֶאֱכָלִים בְּכָל הָעִיר... וְהוּא הַדִּין לְמַעֲשֵׂר וּפֶסַח שֶׁהֲרֵי הֵן קָדָשִׁים קַלִּים כִּשְׁלָמִים.', en: 'All of these (shelamim and the like) are eaten anywhere in the city, and so the maaser and the pesach, since they are kodashim kalim like shelamim.' },
    'MK 10:6': { he: 'הַשְּׁלָמִים נֶאֱכָלִים בְּיוֹם הַזְּבִיחָה וְכָל הַלַּיְלָה וְכָל יוֹם הַמָּחֳרָת עַד שֶׁתִּשְׁקַע הַחַמָּה... נֶאֱכָלִין לִשְׁנֵי יָמִים וְלַיְלָה אֶחָד.', en: 'Shelamim are eaten on the day of slaughter, that night and the next day until sunset: two days and one night.' },
    'MK 10:7': { he: 'אֲבָל הַתּוֹדָה אַף עַל פִּי שֶׁהִיא קָדָשִׁים קַלִּים אֵינָהּ נֶאֱכֶלֶת אֶלָּא בְּיוֹם הַזְּבִיחָה עִם הַלַּיְלָה... וְהוּא הַדִּין לְחַטָּאת וּלְאָשָׁם.', en: 'The todah, though kodashim kalim, is eaten only on the day of slaughter and the night that follows; so too the chatas and the asham.' },
    'Vayikra 1:2': { he: 'אָדָם כִּי־יַקְרִיב מִכֶּם קָרְבָּן לַה׳ מִן־הַבְּהֵמָה מִן־הַבָּקָר וּמִן־הַצֹּאן תַּקְרִיבוּ אֶת־קָרְבַּנְכֶם׃', en: 'When a person among you brings an offering to Hashem, from the animals, from the cattle or from the flock you shall bring your offering.' },
    'Vayikra 1:3': { he: 'אִם־עֹלָה קָרְבָּנוֹ מִן־הַבָּקָר זָכָר תָּמִים יַקְרִיבֶנּוּ׃', en: 'If his offering is an olah of cattle, he shall bring a male without blemish.' },
    'Vayikra 1:10': { he: 'וְאִם־מִן־הַצֹּאן קָרְבָּנוֹ מִן־הַכְּשָׂבִים אוֹ מִן־הָעִזִּים לְעֹלָה זָכָר תָּמִים יַקְרִיבֶנּוּ׃', en: 'If his offering is from the flock, of sheep or of goats, for an olah: a male without blemish.' },
    'Vayikra 1:14': { he: 'וְאִם מִן־הָעוֹף עֹלָה קָרְבָּנוֹ לַה׳ וְהִקְרִיב מִן־הַתֹּרִים אוֹ מִן־בְּנֵי הַיּוֹנָה אֶת־קָרְבָּנוֹ׃', en: 'If his offering to Hashem is an olah of birds, he shall bring his offering from turtledoves or from young pigeons.' },
    'Vayikra 1:9': { he: 'וְהִקְטִיר הַכֹּהֵן אֶת־הַכֹּל הַמִּזְבֵּחָה עֹלָה אִשֵּׁה רֵיחַ־נִיחוֹחַ לַה׳׃', en: 'The kohen shall burn it all on the altar: an olah, a fire-offering of pleasing aroma to Hashem.' },
    'Vayikra 1:11': { he: 'וְשָׁחַט אֹתוֹ עַל יֶרֶךְ הַמִּזְבֵּחַ צָפֹנָה לִפְנֵי ה׳׃', en: 'He shall slaughter it on the north side of the altar before Hashem.' },
    'Vayikra 3:1': { he: 'וְאִם־זֶבַח שְׁלָמִים קָרְבָּנוֹ אִם מִן־הַבָּקָר הוּא מַקְרִיב אִם־זָכָר אִם־נְקֵבָה תָּמִים יַקְרִיבֶנּוּ לִפְנֵי ה׳׃', en: 'If his offering is a shelamim, if he brings from the cattle, whether male or female, without blemish he shall bring it.' },
    'Vayikra 3:9': { he: 'חֶלְבּוֹ הָאַלְיָה תְמִימָה לְעֻמַּת הֶעָצֶה יְסִירֶנָּה...', en: 'Its fat, the whole fat tail, he shall remove close to the backbone...' },
    'Bamidbar 15:27': { he: 'וְאִם־נֶפֶשׁ אַחַת תֶּחֱטָא בִשְׁגָגָה וְהִקְרִיבָה עֵז בַּת־שְׁנָתָהּ לְחַטָּאת׃', en: 'If one person sins unintentionally, he shall bring a she-goat in her first year as a chatas.' },
    'MK 1:5': { he: 'קָרְבְּנוֹת הַצִּבּוּר הֵם שְׁנֵי תְּמִידִין שֶׁל כָּל יוֹם. וּמוּסְפֵי שַׁבָּתוֹת וְרָאשֵׁי חֳדָשִׁים וְהַמּוֹעֲדוֹת וּשְׂעִיר חַטָּאת שֶׁל יוֹם הַכִּפּוּרִים. וְכֵן אִם שָׁגְגוּ בֵּית דִּין וְהוֹרוּ בַּעֲבוֹדָה זָרָה מֵבִיא כָּל שֵׁבֶט וְשֵׁבֶט פַּר וְשָׂעִיר. הַפָּר עוֹלָה וְהַשָּׂעִיר חַטָּאת... וְאִם שָׁגְגוּ וְהוֹרוּ בִּשְׁאָר הַמִּצְוֹת מְבִיאִין פַּר לְחַטָּאת וְהוּא הַנִּקְרָא פַּר הֶעְלֵם דָּבָר שֶׁל צִבּוּר.', en: 'The communal offerings are the two daily tamid offerings, the musafim of Shabbos, Rosh Chodesh and the festivals, and the chatas goat of Yom Kippur. And if the beis din erred and ruled to permit idolatry, each tribe brings a bull and a goat: the bull an olah, the goat a chatas. If they erred in any other mitzvah, they bring a bull as a chatas, the par he\'elem davar of the community.' },
    'MK 1:6': { he: '...וְכֵן אֵיל הָעוֹלָה וּפַר הַחַטָּאת שֶׁמַּקְרִיב כֹּהֵן גָּדוֹל מִשֶּׁלּוֹ בְּיוֹם הַכִּפּוּרִים הֲרֵי הֵן קָרְבַּן יָחִיד. וּפַר זֶה הוּא הַנִּקְרָא פַּר יוֹם הַכִּפּוּרִים.', en: 'The ram for an olah and the bull for a chatas that the kohen gadol brings from his own funds on Yom Kippur are individual offerings. This bull is called the bull of Yom Kippur.' },
    'Shegagos 1:4': { he: '...אִם שָׁגַג בַּעֲבוֹדָה זָרָה מֵבִיא עֵז בַּת שְׁנָתָהּ לְחַטָּאת... אֲבָל אִם שָׁגַג בְּאַחַת מִשְּׁאָר אַרְבָּעִים וּשְׁתַּיִם אִם הָיָה הֶדְיוֹט מֵבִיא שְׂעִירַת עִזִּים אוֹ נְקֵבָה מִן הַכְּבָשִׂים... וְאִם כֹּהֵן מָשׁוּחַ הוּא מֵבִיא פַּר בֶּן בָּקָר לְחַטָּאת וְהוּא נִשְׂרָף.', en: 'One who worshipped idolatry by mistake brings a she-goat in her first year as a chatas. For any of the other forty-two sins, an ordinary person brings a female goat or a female sheep. A kohen mashiach brings a young bull as a chatas, and it is burned.' },
    'Vayikra 4:28': { he: 'וְהֵבִיא קָרְבָּנוֹ שְׂעִירַת עִזִּים תְּמִימָה נְקֵבָה עַל־חַטָּאתוֹ אֲשֶׁר חָטָא׃', en: 'He shall bring as his offering a female goat without blemish for the sin he committed.' },
    'Vayikra 4:32': { he: 'וְאִם־כֶּבֶשׂ יָבִיא קָרְבָּנוֹ לְחַטָּאת נְקֵבָה תְמִימָה יְבִיאֶנָּה׃', en: 'If he brings a sheep as his chatas, he shall bring a female without blemish.' },
    'Vayikra 5:15': { he: 'וְהֵבִיא אֶת־אֲשָׁמוֹ לַה׳ אַיִל תָּמִים מִן־הַצֹּאן בְּעֶרְכְּךָ כֶּסֶף־שְׁקָלִים בְּשֶׁקֶל־הַקֹּדֶשׁ לְאָשָׁם׃', en: 'He shall bring his asham to Hashem: a ram without blemish from the flock, by your valuation in silver shekels, for an asham.' },
    'Vayikra 7:8': { he: 'וְהַכֹּהֵן הַמַּקְרִיב אֶת־עֹלַת אִישׁ עוֹר הָעֹלָה אֲשֶׁר הִקְרִיב לַכֹּהֵן לוֹ יִהְיֶה׃', en: 'The kohen who offers a person\'s olah: the hide of the olah he offered shall be the kohen\'s.' },
    'Vayikra 22:20': { he: 'כֹּל אֲשֶׁר־בּוֹ מוּם לֹא תַקְרִיבוּ כִּי־לֹא לְרָצוֹן יִהְיֶה לָכֶם׃', en: 'Anything that has a blemish you shall not offer, for it will not be accepted for you.' },
    'Vayikra 22:27': { he: 'שׁוֹר אוֹ־כֶשֶׂב אוֹ־עֵז כִּי יִוָּלֵד וְהָיָה שִׁבְעַת יָמִים תַּחַת אִמּוֹ וּמִיּוֹם הַשְּׁמִינִי וָהָלְאָה יֵרָצֶה לְקָרְבַּן אִשֶּׁה לַה׳׃', en: 'When an ox, a sheep or a goat is born, it shall stay seven days with its mother; from the eighth day on it is acceptable as a fire-offering to Hashem.' },
    'Chullin 1:5': { he: 'כָּשֵׁר בַּתּוֹרִין פָּסוּל בִּבְנֵי יוֹנָה, כָּשֵׁר בִּבְנֵי יוֹנָה פָּסוּל בַּתּוֹרִין. תְּחִלַּת הַצִּהוּב בָּזֶה וּבָזֶה פָּסוּל.', en: 'What is fit in turtledoves is unfit in young pigeons, and what is fit in young pigeons is unfit in turtledoves (grown turtledoves, young pigeons). At the start of the yellowing of the neck feathers, both are unfit.' },
    'Issurei Mizbeach 3:1': { he: 'תַּמּוּת וְזַכְרוּת בִּבְהֵמָה, וְאֵין תַּמּוּת וְזַכְרוּת בָּעוֹפוֹת.', en: '(Chullin 23a, cited by the Rambam) "Blemish-free and male/female apply to animals, not to birds." The Rambam adds the limit: a bird whose wing has dried, whose eye is blinded or whose leg is severed (a missing limb) is unfit.' },
    'Shekalim 5:3': { he: 'אַרְבָּעָה חוֹתָמוֹת הָיוּ בַּמִּקְדָּשׁ, וְכָתוּב עֲלֵיהֶן עֵגֶל, זָכָר, גְּדִי, חוֹטֵא. בֶּן עַזַּאי אוֹמֵר, חֲמִשָּׁה הָיוּ... עֵגֶל, זָכָר, גְּדִי, חוֹטֵא דַּל, וְחוֹטֵא עָשִׁיר.', en: 'There were four seals in the Mikdash, inscribed: egel, zachar, gedi, chotei. Ben Azzai says there were five: egel, zachar, gedi, chotei dal, and chotei ashir.' },
  };

  // ------------------------------------------------------------------
  // Animals (the Sefer's first chapter)
  // ------------------------------------------------------------------
  const ANIMALS = {
    egel:   { he: 'עֵגֶל', tr: 'egel', en: 'bull calf', species: 'cattle', sex: 'm', age: 'young', sprite: 'calf',
              facts: ['A male of the herd (cattle) in its first year ("ben shanah"), that is, from day 8 until its first birthday.', 'From its second year it is a par.'], src: ['MK 1:14'] },
    eglah:  { he: 'עֶגְלָה', tr: 'eglah', en: 'heifer calf', species: 'cattle', sex: 'f', age: 'young', sprite: 'calf',
              facts: ['A female of the herd in its first year.', 'She will grow up to be a parah.'], src: ['MK 1:14'] },
    par:    { he: 'פַּר', tr: 'par', alt: 'shor — שׁוֹר', en: 'bull', species: 'cattle', sex: 'm', age: 'adult', sprite: 'bull',
              facts: ['A male of the herd from its second year.', 'Cattle may be offered until three full years, day for day; older is zaken and is not offered.'], src: ['MK 1:6', 'MK 1:5', 'MK 1:14', 'MK 1:11', 'Shegagos 1:4'] },
    parah:  { he: 'פָּרָה', tr: 'parah', en: 'cow', species: 'cattle', sex: 'f', age: 'adult', sprite: 'cow',
              facts: ['A grown female of the herd.', 'Like male cattle, she may be offered until three full years.'], src: ['MK 1:11'] },
    keves:  { he: 'כֶּבֶשׂ', tr: 'keves', en: 'lamb (male, first year)', species: 'sheep', sex: 'm', age: 'young', sprite: 'lamb',
              facts: ['Wherever the Torah says keves it means a sheep in its first year.', 'After the year ends it is a pilgas for thirty days, then an ayil.'], src: ['MK 1:14'] },
    kivsah: { he: 'כִּבְשָׂה', tr: 'kivsah', alt: 'kisbah — כִּשְׂבָּה', en: 'ewe lamb (female, first year)', species: 'sheep', sex: 'f', age: 'young', sprite: 'lamb',
              facts: ['A female sheep in its first year.'], src: ['MK 1:14'] },
    ayil:   { he: 'אַיִל', tr: 'ayil', en: 'ram', species: 'sheep', sex: 'm', age: 'adult', sprite: 'ram',
              facts: ['A male sheep in its second year, from day 31 of that year.', 'Sheep may be offered until two full years; older is zaken.', 'Most ashamos call for an ayil.'], src: ['MK 1:14', 'MK 1:11'] },
    rachel: { he: 'רָחֵל', tr: 'rachel', en: 'ewe', species: 'sheep', sex: 'f', age: 'adult', sprite: 'ewe',
              facts: ['A grown female sheep. Of the four kinds she can only be a shelamim: an olah and an asham are male, and the individual\'s chatas is a sheep in its first year (a keves is a first-year animal).', 'The alyah (fat tail) of every sheep offering is burned with the eimurin.'], src: ['MK 1:11', 'MK 1:14', 'MK 1:18'] },
    gedi:   { he: 'גְּדִי', tr: 'gedi', alt: 'se\'ir izim — שְׂעִיר עִזִּים', en: 'kid (male, first year)', species: 'goat', sex: 'm', age: 'young', sprite: 'kid',
              facts: ['A male goat in its first year; the Torah calls it se\'ir izim.', 'Goats have no pilgas stage: the whole second year it is simply a sa\'ir.'], src: ['MK 1:14', 'MK 1:5'] },
    gediyah:{ he: 'גְּדִיָּה', tr: 'gediyah', alt: 'se\'irah — שְׂעִירָה', en: 'kid (female, first year)', species: 'goat', sex: 'f', age: 'young', sprite: 'kid',
              facts: ['A female goat in its first year: the se\'iras izim of an ordinary person\'s chatas.'], src: ['MK 1:14', 'Vayikra 4:28'] },
    sair:   { he: 'שָׂעִיר', tr: 'sa\'ir', alt: 'tayish — תַּיִשׁ', en: 'he-goat', species: 'goat', sex: 'm', age: 'adult', sprite: 'buck',
              facts: ['A male goat in its second year, all of it.', 'Goats may be offered until two full years; older is zaken.'], src: ['MK 1:14', 'MK 1:11'] },
    ez:     { he: 'עֵז', tr: 'ez', alt: 'se\'irah — שְׂעִירָה', en: 'she-goat', species: 'goat', sex: 'f', age: 'adult', sprite: 'nanny',
              facts: ['A grown female goat. Of the four kinds she can only be a shelamim: the individual\'s chatas must be "a she-goat in her first year", ez bas shenasah.', 'The word ez also names the goat species as a whole; the Rambam calls even the nasi\'s male goat "ez".'], src: ['MK 1:11', 'Bamidbar 15:27', 'MK 1:15'] },
    tor:    { he: 'תּוֹר', tr: 'tor', alt: 'pl. torim — תּוֹרִים', en: 'turtledove', species: 'turtledove', sprite: 'turtledove',
              facts: ['Fit only when grown: after the neck feathers turn golden (tzihuv).', 'Male or female alike. Ordinary blemishes do not disqualify a bird; a missing limb, a dried wing or a blinded eye does.'], src: ['MK 1:14', 'Chullin 1:5', 'Issurei Mizbeach 3:1'] },
    ben_yonah: { he: 'בֶּן יוֹנָה', tr: 'ben yonah', alt: 'pl. bnei yonah — בְּנֵי יוֹנָה', en: 'young pigeon', species: 'pigeon', sprite: 'pigeon',
              facts: ['Fit only while young: before the neck feathers turn golden.', 'At the very start of the yellowing, both turtledoves and pigeons are unfit.'], src: ['Chullin 1:5', 'MK 1:8'] },
    pilgas: { he: 'פִּלְגָּס', tr: 'pilgas', en: 'sheep in the first 30 days of its second year', species: 'sheep', sex: 'm', age: 'between', sprite: 'ram', bonus: true,
              facts: ['No longer a keves, not yet an ayil: fit as neither.', 'From day 31 of the second year it is an ayil.'], src: ['MK 1:14'] },
  };
  const ANIMAL_ORDER = ['egel', 'eglah', 'par', 'parah', 'keves', 'kivsah', 'ayil', 'rachel', 'gedi', 'gediyah', 'sair', 'ez', 'tor', 'ben_yonah', 'pilgas'];
  const SPECIES = {
    cattle: { he: 'בָּקָר', en: 'cattle', small: 'cattle' },
    sheep: { he: 'כְּבָשִׂים', en: 'sheep', small: 'sheep' },
    goat: { he: 'עִזִּים', en: 'goat', small: 'goat' },
    turtledove: { he: 'תּוֹרִים', en: 'turtledove', small: 'bird' },
    pigeon: { he: 'בְּנֵי יוֹנָה', en: 'pigeon', small: 'bird' },
  };

  // ------------------------------------------------------------------
  // Korbanos (the Sefer's second chapter)
  // ------------------------------------------------------------------
  const KORBANOS = {
    olah: { he: 'עוֹלָה', tr: 'olah', en: 'burnt offering', kedushah: 'kk',
      facts: ['From the cattle, sheep or goats: males only, young or grown. Or from turtledoves and young pigeons, either sex.',
              'Entirely burned on the mizbeach; nothing is eaten. Only the hide goes to the kohanim.',
              'Kodshei kodashim: slaughtered north of the mizbeach.'], src: ['MK 1:8', 'Vayikra 1:3', 'MK 6:1', 'Vayikra 7:8', 'MK 5:2'] },
    chatat: { he: 'חַטָּאת', tr: 'chatas', en: 'sin offering', kedushah: 'kk',
      facts: ['Brought for an unintentional sin whose deliberate violation carries kares.',
              'The category spans all five species, male or female; but an ordinary person\'s chatas is a female sheep or goat in its first year (a kivsah or a se\'irah), never cattle. Three exceptions: the nasi (male goat), the kohen mashiach and the kohen gadol on Yom Kippur (bulls).',
              'Kodshei kodashim: slaughtered in the north; eaten by male kohanim in the Azarah, on the day of slaughter and that night.'], src: ['MK 1:9', 'MK 1:15', 'Vayikra 4:28', 'Bamidbar 15:27', 'MK 10:3', 'MK 10:7'] },
    asham: { he: 'אָשָׁם', tr: 'asham', en: 'guilt offering', kedushah: 'kk',
      facts: ['Only from male sheep: a ram (ayil) for most ashamos, a lamb (keves) for the asham of a nazir and of a metzora.',
              'Brought for specific cases: me\'ilah, a false oath over money, a doubtful chatas, a shifchah charufah, and in the purification of a nazir and a metzora.',
              'Kodshei kodashim: north; eaten by male kohanim in the Azarah, a day and a night.'], src: ['MK 1:10', 'Vayikra 5:15', 'MK 10:3', 'MK 10:7'] },
    shelamim: { he: 'שְׁלָמִים', tr: 'shelamim', en: 'peace offering', kedushah: 'kalim',
      facts: ['From cattle, sheep or goats, male or female, young or grown. Never from birds.',
              'The eimurin are burned; the chazeh and shok go to the kohanim; the rest is eaten by the owners.',
              'Kodashim kalim: slaughtered anywhere in the Azarah; eaten anywhere in Yerushalayim by anyone tahor, for two days and a night. A todah: only a day and a night.'], src: ['MK 1:11', 'Vayikra 3:1', 'MK 5:2', 'MK 10:5', 'MK 10:6', 'MK 10:7'] },
    pesach: { he: 'פֶּסַח', tr: 'pesach', en: 'paschal offering', kedushah: 'kalim', brief: true,
      facts: ['One of the three further individual offerings (with the bechor and the maaser).', 'A male lamb or kid in its first year. Kodashim kalim.'], src: ['MK 1:3', 'MK 1:17'] },
    bechor: { he: 'בְּכוֹר', tr: 'bechor', en: 'firstborn', kedushah: 'kalim', brief: true,
      facts: ['A male that opens its mother\'s womb; holy from birth; given to a kohen.', 'Kodashim kalim. May be offered from the eighth day even lechatchilah.'], src: ['MK 1:3', 'MK 1:12', 'MK 1:17'] },
    maaser: { he: 'מַעֲשֵׂר בְּהֵמָה', tr: 'maaser beheimah', en: 'animal tithe', kedushah: 'kalim', brief: true,
      facts: ['Every tenth animal born to the herd or flock.', 'Kodashim kalim. May be offered from the eighth day even lechatchilah.'], src: ['MK 1:3', 'MK 1:12', 'MK 1:17'] },
  };
  const KORBAN_ORDER = ['olah', 'chatat', 'asham', 'shelamim', 'pesach', 'bechor', 'maaser'];

  const SEALS = {
    egel: { he: 'עֵגֶל', en: 'Egel seal', level: 1, desc: 'Earned at Sha\'ar HaTzon: the five species, their names and ages.' },
    zachar: { he: 'זָכָר', en: 'Zachar seal', level: 2, desc: 'Earned at the Azarah gate: the four korbanos, their species and sanctity.' },
    gedi: { he: 'גְּדִי', en: 'Gedi seal', level: 3, desc: 'Who brings what. Coming soon.' },
    chotei: { he: 'חוֹטֵא', en: 'Chotei seal', level: 4, desc: 'Olah, chatas and asham in detail. Coming soon.' },
    dal: { he: 'דַּל', en: 'Dal seal', level: 5, desc: 'Communal offerings and kodashim kalim. Coming soon.' },
  };

  // ------------------------------------------------------------------
  // Lessons: what the NPCs teach. Each goes into the journal when heard.
  // ------------------------------------------------------------------
  const LESSONS = {
    five_species: { who: 'the scrolls in Elazar\'s house', title: 'The five species', src: 'MK 1:1',
      lines: ['Of every creature alive, the Torah lets only FIVE onto the mizbeach.', 'Three from the herd and flock: cattle {he:בָּקָר}, sheep {he:כְּבָשִׂים} and goats {he:עִזִּים}.', 'And two birds: turtledoves {he:תּוֹרִים} and young pigeons {he:בְּנֵי יוֹנָה}.', 'No deer, no chicken, no dove but these. Five. Remember it.'],
      journal: 'Five species only: cattle, sheep, goats, turtledoves, young pigeons.' },
    names_sheep: { who: 'Shepherd Tziviya', title: 'Keves, ayil and the pilgas', src: 'MK 1:14',
      lines: ['See my flock? A male in its first year is a KEVES {he:כֶּבֶשׂ}. A female: KIVSAH {he:כִּבְשָׂה} or KISBAH {he:כִּשְׂבָּה}.', 'When the Torah says AYIL {he:אַיִל}, it means a male in its SECOND year... but not right away.', 'For the first thirty days of the second year he is a PILGAS {he:פִּלְגָּס}: no longer a keves, not yet an ayil, fit as neither!', 'From day thirty-one of the second year: an ayil. A grown female we call a RACHEL {he:רָחֵל}. In English, by the way, a RACHEL is called a "ewe," which is pronounced like "you."'],
      journal: 'Keves/kivsah = first year. Ayil = male from day 31 of second year. Days 1–30 of year two = pilgas, fit as neither. Rachel = grown ewe.' },
    names_goats: { who: 'Shepherd Yoav', title: 'Gedi and sa\'ir', src: 'MK 1:14',
      lines: ['Goats are simpler than sheep. The Torah uses the term SE\'IR IZIM {he:שְׂעִיר עִזִּים} or the like, such as EZ {he:עֵז} or SA\'IR {he:שָׂעִיר}, for pretty much any goat.', 'In English, a young goat is called a \'kid\', or in Hebrew, a GEDI {he:גְּדִי}. A female would be called a GEDIYAH {he:גְּדִיָּה}.', 'And don\'t forget, when I say "young," I mean in its first year. Make sure you get Rivka\'s calendar to keep track of all the timing!', 'In the second year the male is a SA\'IR {he:שָׂעִיר}, some say TAYISH {he:תַּיִשׁ}. This starts right after their first birthday.', 'And the grown female is also just an EZ {he:עֵז} or SE\'IRAS IZIM {he:שְׂעִירַת עִזִּים}.', 'Ok, maybe not so simple. But still easier than sheep!'],
      journal: 'Gedi / gediyah (se\'irah) = first year. Sa\'ir (tayish) = all of second year, no pilgas. Ez = she-goat.' },
    names_cattle: { who: 'Cowherd Nachum', title: 'Egel and par', src: 'MK 1:14',
      lines: ['Big ones, eh? A calf in its first year: EGEL {he:עֵגֶל} if male, EGLAH {he:עֶגְלָה} if female.', 'From the second year the male is a PAR {he:פַּר}, also called SHOR {he:שׁוֹר}. The grown female is a PARAH {he:פָּרָה}.', 'Cattle stay fit longer than the flock: until THREE full years. Sheep and goats only until TWO.', 'If one of the cattle is older than three years though, it is a ZAKEN {he:זָקֵן}, too old, and cannot be offered as a korban.'],
      journal: 'Egel/eglah = first year; par (shor)/parah = grown. Cattle fit until 3 full years; sheep and goats until 2. Older = zaken.' },
    ages: { who: 'Avigdor the Elder', title: 'Eight days, thirty days, to the hour', src: 'MK 1:12',
      lines: ['An animal is fit from its EIGHTH day: "from the eighth day on it is acceptable".', 'But lechatchilah we wait until day THIRTY. The bechor, the pesach and the maaser are the exceptions: those may go up on day eight.', 'And we count ages to the HOUR. One hour over the limit at the time of zerikah, and the korban is pasul!'],
      journal: 'Fit from day 8 (bedi\'eved); lechatchilah from day 30, except bechor, pesach, maaser. Age is counted to the hour, through zerikah.' },
    birds: { who: 'Bird-seller Chanah', title: 'Torim and bnei yonah', src: 'Chullin 1:5',
      lines: ['Birds go by LOOKS, not by their birthdays. We check on the neck feathers.', 'A turtledove {he:תּוֹר} is fit only once it is GROWN, after the feathers turn golden.', 'A pigeon {he:בֶּן יוֹנָה} is the opposite: it is fit only while YOUNG, before the gold appears.', 'And right at the start of the yellowing, both are unfit.', 'Bird offerings can always be male or female, it doesn\'t matter.', 'Also, ordinary blemishes do not disqualify a bird; only a missing limb, a dried wing or a blinded eye.'],
      journal: 'Turtledove: fit only grown (after tzihuv). Pigeon: fit only young (before tzihuv). Start of tzihuv: both unfit. Sex and ordinary blemishes do not matter for birds; a missing limb, dried wing or blinded eye does.' },
    calendar: { who: 'Rivka the record-keeper', title: 'Counting an animal\'s age', src: 'MK 1:11',
      lines: ['I keep the birth records for the flocks. It is a very important job!', 'Mammals are fit or unfit as sacrifices depending upon how old they are, counted from the day the animal was born.', 'Day 1 is its birth. From day 8 it may be offered, but ideally, we should wait until the animal is at least 30 days old. From day 30 we offer it without hesitation.', 'Then, the animal is in its FIRST YEAR, which runs until its first birthday. A sheep in that year is called a keves, a goat is a gedi, and a calf is called an egel. Make sure you know that when you meet them in the tall grass!', 'An animal\'s SECOND YEAR starts after its first birthday, and that\'s when the animal is considered an adult. For animals, birthdays are counted from the hour, not just the day, so I also need to have a watch or a clock!', 'For sheep, the first thirty days of that year are the odd stretch, the pilgas, when it is unfit to be offered. (We don\'t like teenaged sheep.) From day 31 it is an adult sheep, an ayil. Goats and cattle have no such restrictions though, they can be offered from their first birthday.', 'Sheep and goats are offered until they turn two. Cattle until they turn three. After that the animal is zaken (too old) and cannot be offered.'],
      journal: 'Age is counted from birth. Day 8: may be offered. Day 30: offered without hesitation. First year: keves / gedi / egel. Second year: ayil (sheep, from day 31), sa\'ir, par. Sheep and goats until 2 full years, cattle until 3; then zaken.' },
    mum: { who: 'Mevaker Shimon', title: 'A mum disqualifies', src: 'Vayikra 22:20',
      lines: ['I am the mevaker, the inspector. Every animal passes my eyes before the gate.', 'A blind eye, a broken leg, a split ear: any MUM {he:מוּם} the Torah lists, and the animal is pasul, however fine its age.', '"Anything that has a blemish you shall not offer."'],
      journal: 'Any mum (blemish) disqualifies an animal at any age: blind, broken limb, and the rest.' },
    four_kinds: { who: 'Kohen Nechunya', title: 'The four kinds', src: 'MK 1:2',
      lines: ['Welcome to the city, trainee. Elazar sent word about you, and if you made it past the gate, you must know your animals. But do you know what the animals are for?', 'Every korban of an animal, communal or private, is one of FOUR kinds. OLAH {he:עוֹלָה}, CHATAS {he:חַטָּאת}, ASHAM {he:אָשָׁם}, SHELAMIM {he:שְׁלָמִים}.', 'There are additional subcategories of some of these, and three more belong to individuals: the pesach, the bechor and the maaser. But focus on the four basic categories first.'],
      journal: 'Four kinds: olah, chatas, asham, shelamim. Plus three individual ones: pesach, bechor, maaser.' },
    olah_rules: { who: 'Kohen Yishmael', title: 'The olah', src: 'MK 1:8',
      lines: ['An OLAH goes up entirely: it is flayed, cut, and then every piece burned on the mizbeach. Nobody eats it. Only the hide is ours, that is, the kohanim\'s.', 'An olah can be any one of the five animals, but if it is a mammal, it must be MALE: a par or egel, an ayil or keves, a sa\'ir or gedi.', 'From birds, that is, an adult turtledove or a young pigeon, the olah can be male or female alike.'],
      journal: 'Olah: entirely burned, hide to the kohanim. Animal olah is male only; bird olah either sex.' },
    chatat_rules: { who: 'Kohen Yishmael', title: 'The chatas', src: 'MK 1:15',
      lines: ['A CHATAS is a sin-offering, a korban usually brought by someone who has done something wrong and needs "atonement."', 'Usually, this is brought because someone unintentionally did a sin (violated a prohibition) that would have been punished by "kares" if done on purpose.', 'An ordinary person brings a FEMALE in her FIRST YEAR from the flock: a se\'iras izim or a kivsah, "a she-goat in her first year" or female lamb. No cattle, though.', 'But! That\'s only true for a regular person. The nasi brings a male goat (sa\'ir), and the kohen gadol brings a par, a bull.', 'The fats of the CHATAS animal are burned, but most of the meat is eaten by male kohanim in the Azarah. They have only that one day and that night to finish eating it.'],
      journal: 'Chatas of an individual: a female sheep or goat in its first year (kivsah or se\'irah), never cattle. Exceptions: nasi (male goat), kohen mashiach (bull), kohen gadol on Yom Kippur (bull). Eaten by male kohanim in the Azarah, a day and a night.' },
    asham_rules: { who: 'Merchant Baruch', title: 'The asham', src: 'MK 1:10',
      lines: ['Need an ASHAM? Then you need a SHEEP, and a MALE one. Nothing else will do: no goat, no bull, no bird.', 'Most ashamos take a grown ram, an ayil. The nazir and the metzora bring a keves, a lamb.', 'It is kodshei kodashim: the kohanim eat it in the Azarah, for one day and one night.'],
      journal: 'Asham: male sheep only (ayil for most; keves for nazir and metzora). Kodshei kodashim.' },
    shelamim_rules: { who: 'Devorah', title: 'The shelamim', src: 'MK 10:6',
      lines: ['Mmm... Smell that? Our SHELAMIM, roasting. We eat it ourselves, anywhere in the city, anyone who is tahor.', 'We have two days, with one night in between, to eat a regular shelamim. But there is also a subcategory of shelamim, the TODAH, which comes with bread and must be eaten within one day and night.', 'Shelamim can be any mammal at all! I mean, from the animals that are kosher for sacrificing, at least: cattle, sheep or goats, male or female, young or adult. But never a bird.', 'The kohanim get the chazeh and the shok; the eimurin burn on the mizbeach; the rest is ours.'],
      journal: 'Shelamim: cattle/sheep/goats, male or female, no birds. Eaten anywhere in Yerushalayim by anyone tahor, two days and a night (todah: one day and a night). Kohanim get chazeh and shok.' },
    kedushah: { who: 'Levi Asaf', title: 'Two levels of holiness', src: 'MK 1:17',
      lines: ['Every korban has a rank. KODSHEI KODASHIM {he:קָדְשֵׁי קָדָשִׁים}: the olos, the chataos, the ashamos, and the two shelamim lambs of Shavuos.', 'KODASHIM KALIM {he:קָדָשִׁים קַלִּים}: an individual\'s shelamim, the bechor, the maaser and the pesach.', 'Kodshei kodashim are slaughtered only NORTH of the mizbeach and eaten by male kohanim in the Azarah.', 'Kodashim kalim: slaughtered anywhere in the Azarah, and can be eaten anywhere in Yerushalayim.'],
      journal: 'Kodshei kodashim (olah, chatas, asham, Shavuos lambs): north; eaten by male kohanim in the Azarah. Kodashim kalim (shelamim, bechor, maaser, pesach): anywhere in the Azarah; eaten anywhere in the city.' },
    eimurin: { who: 'Kohen Yishmael', title: 'Eimurin and the alyah', src: 'MK 1:18',
      lines: ['Of a chatas, an asham or a shelamim, these parts burn on the mizbeach: the fat on the innards, the two kidneys with their fat and the fat on the flanks, and the lobe of the liver. We call them the EIMURIN.', 'From a SHEEP, one more: the whole fat tail, the ALYAH {he:אַלְיָה}. Goats and cattle have no alyah.'],
      journal: 'Eimurin: fat on the innards, two kidneys with their fat and the flank fat, lobe of the liver. Sheep add the alyah.' },
    tzibur: { who: 'Levi Asaf', title: 'What the community brings', src: 'MK 1:4',
      lines: ['A person can bring a korban, but the entire community also has to bring sacrifices sometimes that are offered on behalf of the entire Jewish people. But the community brings only OLOS and CHATAOS.', 'There are no communal asham offerings, but there is just one SHELAMIM: the two lambs brought on the holiday of Shavuos are the only communal shelamim.', 'And every communal korban is male: its chatas from a goat or a bull, its olah from a sheep or a bull.', 'Also, the community never brings any bird sacrifices. Birds are small; it wouldn\'t be right to have the whole nation sacrificing a cheap little bird!'],
      journal: 'Community: only olah and chatas (plus the two Shavuos shelamim lambs). Never asham, never birds. All male.' },
    seals: { who: 'Mevaker Shimon', title: 'The seals of the Mikdash', src: 'Shekalim 5:3',
      lines: ['Carry this seal with you. In the Mikdash they use four seals: EGEL, ZACHAR, GEDI, CHOTEI (and Ben Azzai counts five, because he splits CHOTEI into two).', 'Hold onto these seals, but it is ok if you do not yet understand why. For now, let this seal be a token of what you learned at my gate.'],
      journal: 'The Mikdash\'s seals (Shekalim 5:3): egel, zachar, gedi, chotei (Ben Azzai: chotei dal, chotei ashir).' },
  };

  // ------------------------------------------------------------------
  // Curated questions (for pilgrims and gatekeepers). a = index of answer.
  // ------------------------------------------------------------------
  const QUESTIONS = [
    // ---- Level 1
    { id: 'q1_species_count', lvl: 1, q: 'From how many species (mammals and birds) may a korban of a living creature be brought?', opts: ['Five', 'Three', 'Seven', 'Two'], a: 0, why: 'Five: cattle, sheep, goats, turtledoves and young pigeons.', src: 'MK 1:1', gate: false },
    { id: 'q1_mammals', lvl: 1, q: 'Which three mammals may be brought as korbanos?', opts: ['Cattle, sheep, goats', 'Cattle, sheep, deer', 'Sheep, goats, camels', 'Cattle, goats, gazelles'], a: 0, why: 'Only the domesticated herd and flock: bakar, kevasim, izim.', src: 'Vayikra 1:2' },
    { id: 'q1_birds', lvl: 1, q: 'Which species of birds may be brought as korbanos?', opts: ['Turtledoves and pigeons', 'Doves and chickens', 'Turtledoves and quail', 'Any kosher bird'], a: 0, why: 'Torim and bnei yonah only.', src: 'Vayikra 1:14' },
    { id: 'q1_tor_age', lvl: 1, q: 'When is a turtledove (tor) fit for the mizbeach?', opts: ['Only when grown', 'Only when young', 'At any age', 'After day 30'], a: 0, why: 'Turtledoves must be grown; pigeons must be young.', src: 'Chullin 1:5' },
    { id: 'q1_yonah_age', lvl: 1, q: 'When is a pigeon (ben yonah) fit?', opts: ['Only while young', 'Only when grown', 'At any age', 'From its eighth day'], a: 0, why: 'A ben yonah is fit while young, before its neck feathers turn golden.', src: 'Chullin 1:5' },
    { id: 'q1_tzihuv', lvl: 1, q: 'A bird is right at the START of tzihuv (its neck feathers beginning to yellow). Is it fit?', opts: ['Unfit, whether turtledove or pigeon', 'Fit if a turtledove', 'Fit if a pigeon', 'Fit either way'], a: 0, why: 'At the start of the yellowing, both species are unfit.', src: 'Chullin 1:5' },
    { id: 'q1_min_age', lvl: 1, q: 'From what age is an animal valid as a korban?', opts: ['From the eighth day', 'From the first day', 'From the thirtieth day', 'From one year'], a: 0, why: 'Valid from day eight; although for most korbanot, ideally you\'d wait for day thirty.', src: 'Vayikra 22:27' },
    { id: 'q1_lechatchilah', lvl: 1, q: 'An animal is 12 days old. May it be offered?', opts: ['Valid, but lechatchilah wait until day 30', 'Not at all until day 30', 'Yes, with no reservation', 'Not until it is a year old'], a: 0, why: 'From day eight it is valid, but for most sacrifices, one should ideally not offer an animal before day thirty, except for bechor, pesach and maaser.', src: 'MK 1:12' },
    { id: 'q1_exceptions30', lvl: 1, q: 'Which may be offered on day eight even lechatchilah?', opts: ['Bechor, pesach and maaser', 'Olah and shelamim', 'Chatas and asham', 'None at all'], a: 0, why: 'The bechor, the pesach and the maaser are the exceptions to waiting for day thirty.', src: 'MK 1:12' },
    { id: 'q1_max_cattle', lvl: 1, q: 'Up to what age may cattle be offered?', opts: ['Three full years', 'Two full years', 'One year', 'Five years'], a: 0, why: 'Cattle until three full years, day for day; beyond that it is zaken.', src: 'MK 1:11' },
    { id: 'q1_max_tzon', lvl: 1, q: 'Up to what age may sheep and goats be offered?', opts: ['Two full years', 'Three full years', 'One year', 'Eighteen months'], a: 0, why: 'The flock until two full years; beyond that it is zaken and is not offered.', src: 'MK 1:11' },
    { id: 'q1_keves', lvl: 1, q: 'Until when is a male sheep called a keves?', opts: ['Until it completes its first year', 'Until it is two', 'Until it grows horns', 'Until day 30'], a: 0, why: 'Keves, kavsah, kevasim: first year.', src: 'MK 1:14' },
    { id: 'q1_ayil_from', lvl: 1, q: 'From when is a male sheep called an ayil?', opts: ['From day 31 of its second year', 'The day it turns one', 'From day 30 of its first year', 'From its third year'], a: 0, why: 'An ayil from thirty-one days into the second year; the first thirty days are the pilgas.', src: 'MK 1:14' },
    { id: 'q1_pilgas', lvl: 1, q: 'A male sheep is one year and twenty days old. What is it?', opts: ['A pilgas', 'A keves', 'An ayil', 'A zaken'], a: 0, why: 'In the first thirty days of its second year it is a pilgas, and unfit to be brought as a korban.', src: 'MK 1:14' },
    { id: 'q1_goat_second', lvl: 1, q: 'A male goat is one year and ten days old. What is it?', opts: ['A sa\'ir', 'A pilgas', 'A gedi', 'A zaken'], a: 0, why: 'Goats have no pilgas: the whole second year it is called a sa\'ir.', src: 'MK 1:14' },
    { id: 'q1_mum', lvl: 1, q: 'A ram in its second year has a broken leg. Is it fit?', opts: ['No: a mum (blemish) disqualifies', 'No: it is too old', 'Yes, for an olah', 'Yes, for a shelamim'], a: 0, why: '"Anything that has a blemish you shall not offer."', src: 'Vayikra 22:20' },
    { id: 'q1_bird_mum', lvl: 1, q: 'A turtledove has a blemish on its wing but no limb is missing. Is it fit?', opts: ['Fit: blemishes do not disqualify birds', 'Unfit: like any mum', 'Fit only as an olah', 'Unfit unless it is young'], a: 0, why: 'Blemish-free and male/female apply to animals, not birds. Only a missing limb, a dried wing or a blinded eye disqualifies a bird.', src: 'Issurei Mizbeach 3:1' },
    { id: 'q1_egel', lvl: 1, q: 'Wherever the Torah says egel, the animal is...', opts: ['In its first year', 'In its second year', 'Any age under three', 'Under thirty days'], a: 0, why: 'Egel: ben shanah. Par: from the second year.', src: 'MK 1:14' },
    { id: 'q1_name_cow', lvl: 1, q: 'What is a grown female of the herd (cattle) called?', opts: ['Parah', 'Eglah', 'Rachel', 'Ez'], a: 0, why: 'Parah is the cow; eglah is the female calf.', src: 'MK 1:11' },
    { id: 'q1_name_ram', lvl: 1, q: 'What is a grown male sheep called?', opts: ['Ayil', 'Kisbah', 'Ez', 'Parah'], a: 0, why: 'An ayil is a grown male sheep. Rachel is the ewe; kisbah (or kivsah) is a female in its first year.', src: 'MK 1:14' },
    { id: 'q1_name_gedi', lvl: 1, q: 'The Torah\'s se\'ir izim is...', opts: ['A male goat in its first year', 'A male sheep in its second year', 'A female goat in its first year', 'A female goat in its second year'], a: 0, why: 'Se\'ir izim: ben shanah. Usually.', src: 'MK 1:14' },
    { id: 'q1_zaken', lvl: 1, q: 'A goat is two years and one month old. Is it fit?', opts: ['No: it is too old', 'Yes, until three years', 'Yes, as a sa\'ir', 'Only as a shelamim'], a: 0, why: 'Sheep and goats only until two full years.', src: 'MK 1:11' },
    { id: 'q1_name_kivsah', lvl: 1, q: 'What is a female sheep in its first year called?', opts: ['Kivsah (or kisbah)', 'Rachel', 'Eglah', 'Ayil'], a: 0, why: 'A kivsah, also called kisbah, is a female sheep in its first year; grown, she is a rachel.', src: 'MK 1:14' },
    { id: 'q1_hours_birthday', lvl: 1, q: 'A lamb was born at noon. When does it turn one year old?', opts: ['At noon on its birthday', 'At sunrise on its birthday', 'At nightfall the evening before', 'At the end of its birthday'], a: 0, why: 'Ages are counted to the hour, so it turns one at the same hour it was born.', src: 'MK 1:13' },
    // ---- Level 2
    { id: 'q2_four', lvl: 2, q: 'What are the four kinds of korban?', opts: ['Olah, chatas, asham, shelamim', 'Olah, minchah, pesach, bechor', 'Chatas, asham, todah, minchah', 'Olah, chatas, pesach, maaser'], a: 0, why: 'Every korban, communal or individual, is one of these four.', src: 'MK 1:2' },
    { id: 'q2_three_more', lvl: 2, q: 'Which three further offerings belong to individuals alone?', opts: ['Pesach, bechor, maaser', 'Tamid, musaf, omer', 'Todah, nazir, metzora', 'Olah, chatas, asham'], a: 0, why: 'The pesach, the bechor and the maaser.', src: 'MK 1:3' },
    { id: 'q2_olah_eaten', lvl: 2, q: 'What happens to the flesh of an olah?', opts: ['Entirely burned on the mizbeach', 'Eaten by the kohanim', 'Eaten by the owner and guests', 'Part is eaten by the owner, part by kohanim'], a: 0, why: 'The olah goes up entirely; nothing is eaten. Only the hide goes to the kohanim.', src: 'MK 6:1' },
    { id: 'q2_olah_hide', lvl: 2, q: 'Who receives the hide of an olah?', opts: ['The kohanim', 'The owner', 'It is burned', 'The Levi\'im'], a: 0, why: '"The hide of the olah he offered shall be the kohen\'s."', src: 'Vayikra 7:8' },
    { id: 'q2_olah_sex', lvl: 2, q: 'What kind of (mammal) animal can be brought as an olah?', opts: ['Only a male', 'Only a sheep', 'Only a goat', 'Only a young animal (lamb, kid, or calf)'], a: 0, why: 'An animal olah comes only from males, but different circumstances call for different species. A bird olah may be either sex.', src: 'MK 1:8' },
    { id: 'q2_olah_bird', lvl: 2, q: 'May a female turtledove be brought as an olah?', opts: ['Yes: bird olos are either sex', 'No: olos are male only', 'No: birds are never olos', 'Only if it is young'], a: 0, why: 'From turtledoves and young pigeons, "male and female alike".', src: 'MK 1:8' },
    { id: 'q2_chatat_what', lvl: 2, q: 'A chatas is brought for...', opts: ['An unintentional sin punishable by kares if deliberate', 'Any sin, even deliberate', 'A false oath about money', 'Thanksgiving after danger'], a: 0, why: 'The chatas atones for a shogeg on a kares-level sin.', src: 'MK 1:9' },
    { id: 'q2_chatat_sex', lvl: 2, q: 'An ordinary Yisrael who brings a chatas must use...', opts: ['A female sheep or goat in its first year', 'A male sheep in its first year', 'A male sheep after its first year', 'A female sheep or goat after its first year'], a: 0, why: 'Every individual\'s chatas is female and not from cattle, and the Torah asks for "a she-goat in her first year": a se\'iras izim or a kivsah.', src: 'Bamidbar 15:27' },
    { id: 'q2_chatat_exc', lvl: 2, q: 'Who brings a MALE animal as a chatas?', opts: ['The nasi, the kohen mashiach, the kohen gadol on Yom Kippur', 'Anyone who is wealthy', 'A nazir and a metzora', 'Nobody'], a: 0, why: 'Three exceptions: the nasi (male goat), the kohen mashiach (bull), the kohen gadol\'s Yom Kippur bull.', src: 'MK 1:15' },
    { id: 'q2_nasi', lvl: 2, q: 'What chatas does a nasi bring?', opts: ['A male goat (sa\'ir izim)', 'A bull', 'A female goat', 'A ram'], a: 0, why: 'The nasi\'s chatas is a male goat, and it is eaten.', src: 'MK 1:15' },
    { id: 'q2_asham_species', lvl: 2, q: 'From which animals may an asham be brought?', opts: ['Male sheep only', 'Male sheep or goats', 'Female sheep in its first year', 'Female goat in its first year'], a: 0, why: 'The asham comes only from male sheep.', src: 'MK 1:10' },
    { id: 'q2_asham_age', lvl: 2, q: 'Which asham is brought from a keves (lamb) rather than a ram?', opts: ['The asham of a nazir and of a metzora', 'The asham for me\'ilah', 'The asham talui', 'All ashamos are rams'], a: 0, why: 'Some ashamos come from grown sheep and some from young: the nazir\'s and the metzora\'s are lambs.', src: 'MK 1:10' },
    { id: 'q2_shelamim_species', lvl: 2, q: 'From which animals may shelamim be brought?', opts: ['Cattle, sheep or goats, male or female', 'Cattle, sheep or goats, male only', 'Any of the five species', 'Sheep and goats only'], a: 0, why: 'Shelamim from the herd and flock, either sex; no bird shelamim.', src: 'MK 1:11' },
    { id: 'q2_shelamim_bird', lvl: 2, q: 'A pair of turtledoves CAN be brought as...', opts: ['Olah of an individual', 'Shelamim of an individual', 'Olah of the community', 'Shelamim of the community'], a: 0, why: 'Birds can be an individual\'s olah. There are no bird shelamim, and the community never brings birds.', src: 'MK 1:11' },
    { id: 'q2_shelamim_who', lvl: 2, q: 'Who eats the shelamim?', opts: ['The owners, after the kohanim take chazeh and shok', 'Male kohanim only', 'No one: it is burned', 'The Levi\'im'], a: 0, why: 'The eimurin burn, the chazeh and shok go to the kohanim, the rest is the owners\'.', src: 'MK 10:6' },
    { id: 'q2_shelamim_where', lvl: 2, q: 'Where may shelamim be eaten?', opts: ['Anywhere in Yerushalayim', 'Only in the Azarah', 'Only in the owner\'s home', 'Only on the Har HaBayis'], a: 0, why: 'Kodashim kalim are eaten anywhere in the city.', src: 'MK 10:5' },
    { id: 'q2_shelamim_time', lvl: 2, q: 'For how long may shelamim be eaten?', opts: ['Two days and one night', 'One day and one night', 'Three days', 'Until midnight'], a: 0, why: 'The day of slaughter, the night, and the next day until sunset.', src: 'MK 10:6' },
    { id: 'q2_todah_time', lvl: 2, q: 'For how long may a todah be eaten?', opts: ['One day and one night', 'Two days and one night', 'Seven days', 'Until sunset only'], a: 0, why: 'The todah, though kodashim kalim, is eaten only that day and that night.', src: 'MK 10:7' },
    { id: 'q2_chatat_time', lvl: 2, q: 'For how long may a chatas or asham be eaten?', opts: ['The day of slaughter and the following night', 'Two days and one night', 'Until the next morning\'s tamid', 'Seven days'], a: 0, why: 'Chatas and asham: a day and a night.', src: 'MK 10:7' },
    { id: 'q2_chatat_who', lvl: 2, q: 'Who eats an ordinary chatas, and where?', opts: ['Male kohanim, in the Azarah', 'The owners, in the city', 'Any kohen, anywhere', 'No one: every chatas is burned'], a: 0, why: 'Chatas and asham are eaten only by male kohanim in the Azarah.', src: 'MK 10:3' },
    { id: 'q2_kk_list', lvl: 2, q: 'Which are kodshei kodashim?', opts: ['Olah, chatas, asham, the two Shavuos lambs', 'Shelamim, bechor, maaser, pesach', 'Olah and shelamim', 'Chatas and pesach'], a: 0, why: 'Olos, chataos, ashamos and the two shelamim lambs of Shavuos.', src: 'MK 1:17' },
    { id: 'q2_kalim_list', lvl: 2, q: 'Which are kodashim kalim?', opts: ['Shelamim of an individual, bechor, maaser, pesach', 'Olah, chatas, asham', 'Only chatas and asham', 'Only bechor, maaser, pesach'], a: 0, why: 'An individual\'s shelamim, the bechor, the maaser and the pesach are the only kodashim kalim.', src: 'MK 1:17' },
    { id: 'q2_north', lvl: 2, q: 'Where must kodshei kodashim be slaughtered?', opts: ['North of the mizbeach', 'Anywhere in the Azarah', 'At the entrance of the Heichal', 'East of the mizbeach'], a: 0, why: '"He shall slaughter it on the north side of the altar."', src: 'MK 5:2' },
    { id: 'q2_kalim_where', lvl: 2, q: 'Where may kodashim kalim be slaughtered?', opts: ['Anywhere in the Azarah', 'Only north of the mizbeach', 'Anywhere in Yerushalayim', 'Only on the mizbeach ramp'], a: 0, why: 'Kodashim kalim are slaughtered anywhere in the Azarah.', src: 'MK 5:2' },
    { id: 'q2_eimurin', lvl: 2, q: 'What are the eimurin?', opts: ['The fats and organs burned on the mizbeach', 'The kohen\'s portion of meat', 'The hide and the horns', 'The wine libations'], a: 0, why: 'The fat on the innards, the kidneys with their fat, the flank fat and the lobe of the liver.', src: 'MK 1:18' },
    { id: 'q2_alyah', lvl: 2, q: 'Which species adds the alyah (fat tail) to its eimurin?', opts: ['Sheep', 'Goats', 'Cattle', 'All three'], a: 0, why: 'Only sheep have the alyah; it is burned whole with the eimurin.', src: 'MK 1:18' },
    { id: 'q2_tzibur', lvl: 2, q: 'Which kinds of korban may the community bring?', opts: ['Only olah and chatas (plus the two Shavuos shelamim lambs)', 'All four kinds', 'Olah, chatas and asham', 'Olah and shelamim'], a: 0, why: 'The community never brings an asham or a bird; its only shelamim are the two Shavuos lambs.', src: 'MK 1:4' },
    { id: 'q2_tzibur_bird', lvl: 2, q: 'May the community bring a bird offering?', opts: ['Never', 'Yes, as an olah', 'Yes, as a chatas', 'Only on Yom Kippur'], a: 0, why: '"The community never brings an asham, nor a bird."', src: 'MK 1:4' },
    { id: 'q2_shavuos', lvl: 2, q: 'The two Shavuos lambs are the community\'s only...', opts: ['Shelamim', 'Olah', 'Chatas', 'Asham'], a: 0, why: 'The only communal shelamim: the two lambs that come with the loaves on Shavuos, and they are kodshei kodashim.', src: 'MK 1:4' },
    { id: 'q2_bechor_kedushah', lvl: 2, q: 'A bechor is...', opts: ['Kodashim kalim', 'Kodshei kodashim', 'Not a korban at all', 'A kind of asham'], a: 0, why: 'Bechor, maaser and pesach are kodashim kalim.', src: 'MK 1:17' },
  ];

  // ------------------------------------------------------------------
  // Glossary: the first time a term appears in a question, option or
  // explanation it is shown with a plain-English gloss.
  // ------------------------------------------------------------------
  const GLOSS = [
    ['kodshei kodashim', 'most holy offerings'], ['kodashim kalim', 'offerings of lesser holiness'],
    ['kohen mashiach', 'anointed High Priest'], ['kohen gadol', 'High Priest'], ['se\'iras izim', 'female goat'], ['se\'ir izim', 'male goat'],
    ['mizbeach', 'altar'], ['chataos', 'sin-offerings'], ['chatas', 'sin-offering'], ['olos', 'burnt-offerings'], ['olah', 'burnt-offering'],
    ['ashamos', 'guilt-offerings'], ['asham', 'guilt-offering'], ['shelamim', 'peace-offering'], ['todah', 'thanksgiving offering'],
    ['Azarah', 'Temple courtyard'], ['tzihuv', 'the neck feathers turning golden'], ['zaken', 'too old'], ['lechatchilah', 'ideally'],
    ['mum', 'blemish'], ['eimurin', 'the parts burned on the altar'], ['alyah', 'fat tail'], ['tahor', 'ritually pure'], ['nasi', 'ruler'],
    ['kares', 'spiritual cutting-off'], ['shechitah', 'slaughter'], ['zerikah', 'sprinkling the blood'], ['bechor', 'firstborn animal'],
    ['maaser beheimah', 'animal tithe'], ['maaser', 'animal tithe'], ['pesach', 'Passover offering'], ['pilgas', 'in-between sheep'],
    ['kohanim', 'priests'], ['kohen', 'priest'], ['Yerushalayim', 'Jerusalem'], ['Mikdash', 'Temple'], ['musaf', 'additional festival offering'],
    ['Shavuos', 'the festival of Shavuos'], ['nesachim', 'wine libations'], ['Heichal', 'the Sanctuary building'], ['chazeh', 'breast'], ['shok', 'thigh'],
  ];
  function gloss(text) {
    if (!text) return text;
    let out = text;
    for (const [term, g] of GLOSS) {
      const re = new RegExp('(^|[^A-Za-z\'])(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])(?!\\s*\\()', 'i');
      const m = re.exec(out);
      if (m) out = out.slice(0, m.index) + m[1] + m[2] + ' (' + g + ')' + out.slice(m.index + m[0].length);
    }
    return out;
  }

  // When each animal is actually brought (examples from the Torah and the Rambam).
  const USES = {
    egel: ['There is only a single instance where the Torah required a male calf to be sacrificed: on the eighth day of the Mishkan\'s inauguration: "take yourself a calf for a chatas..." (Vayikra 9:2).', 'Otherwise a calf is still fit for plenty of sacrifices: a voluntary olah, a shelamim or todah, and a bechor or ma\'aser.'],
    eglah: ['The Torah never names a first-year female calf for any particular korban. She may be brought as a shelamim or todah, which can be cattle of either sex and any age.', 'The eglah arufah (the heifer of an unsolved murder), however, is not considered an altar offering at all.'],
    par: ['The chatas of the kohen mashiach and the community\'s par he\'elem davar MUST be bull offerings.', 'This is also true of the kohen gadol\'s chatas on Yom Kippur, and of some number of the olos for every holiday (but the number of bulls depends on the holiday).'],
    parah: ['The Torah never names a grown cow for any particular korban. She may be used as a shelamim (but not an olah, which must always be a male).', 'The parah adumah (red heifer) is not an altar offering; it is burned outside to make purifying water.'],
    keves: ['The daily tamid: two lambs every day, morning and afternoon.', 'The korban pesach (a lamb or a kid).', 'The olah of a wealthy yoledes; the asham of a nazir and of a metzora.'],
    kivsah: ['The Torah asks for a kivsah bas shnasah, for example, as the chatas of a nazir, and of a metzora who can afford it.', 'The chatas of an ordinary person who sinned unintentionally (or a female kid).'],
    ayil: ['Most ashamos: for me\'ilah, for a false oath about money, the asham talui.', 'Many olos that are required to be brought by the community are rams: the musaf of Rosh Chodesh and of the festivals includes a ram.'],
    rachel: ['The Torah never names a grown ewe for any particular korban. She may be used as a shelamim, which takes sheep of either sex and any age.'],
    gedi: ['A male goat is brought as a chatas by each tribe when the beis din mistakenly ruled that idolatry was permitted (the se\'irei avodah zarah).', 'The korban pesach may be a kid instead of a lamb: "from the sheep or from the goats" (Shemos 12:5).'],
    gediyah: ['The chatas of an ordinary person who sinned unintentionally: "a she-goat in her first year" (or a female lamb).'],
    sair: ['The chatas of the nasi.', 'On holidays, the community\'s musaf includes a single goat on Rosh Chodesh and every festival. On Yom Kippur, a pair of two goats are brought together "for Hashem and for Azazel." On Shavuos, an additional goat is brought along with the sacrifices that accompany the two loaves.'],
    ez: ['The Torah never names a grown she-goat for any particular korban. She may be a shelamim.'],
    tor: ['The olah and chatas of a poor yoledes, of a zav or zavah, and of a poor metzora. A yoledes always brings at least one bird as a chatas.', 'The middle-income sinner\'s olah ve\'yored; a convert\'s olah.'],
    ben_yonah: ['The same bird offerings as the turtledove: whoever may bring a bird chooses either kind.'],
    pilgas: ['Never: a pilgas is fit neither as a keves nor as an ayil.'],
  };
  const NEVER = ['eglah', 'parah', 'rachel', 'ez'];   // never named for a particular korban
  for (const k of Object.keys(ANIMALS)) { ANIMALS[k].uses = USES[k] || []; ANIMALS[k].never = NEVER.includes(k); }
  // Korbanos pages open once the matching lesson has been heard (Level 2)
  KORBANOS.olah.unlock = 'olah_rules'; KORBANOS.chatat.unlock = 'chatat_rules'; KORBANOS.asham.unlock = 'asham_rules'; KORBANOS.shelamim.unlock = 'shelamim_rules';
  KORBANOS.pesach.unlock = 'four_kinds'; KORBANOS.bechor.unlock = 'four_kinds'; KORBANOS.maaser.unlock = 'four_kinds';

  return { SOURCES, ANIMALS, ANIMAL_ORDER, SPECIES, KORBANOS, KORBAN_ORDER, SEALS, LESSONS, QUESTIONS, gloss, GLOSS };
})();
