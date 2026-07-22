# Change Log

All notable changes to the "tswagger" extension will be documented in this file.

This file is the release record for the VS Code extension only. npm package release notes for `@tswagger/cli`, `@tswagger/core`, and `@tswagger/types` are maintained in their respective package directories.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.6.0](https://github.com/orca-team/vscode-tswagger/compare/extension-v2.5.0...extension-v2.6.0) (2026-07-22)


### Added

* `translation` configuration and setting modal to manage ([c7d61db](https://github.com/orca-team/vscode-tswagger/commit/c7d61db1f62310f31c9ab35c9b2b7016b10bde30))
* add config.json before generating typescript ([cab6f9d](https://github.com/orca-team/vscode-tswagger/commit/cab6f9d0e82a56901a4613214dc1656629a30a95))
* add default configuration for extension ([228fc11](https://github.com/orca-team/vscode-tswagger/commit/228fc117fba8d33c9ac9445bce86441078e8081e))
* add editor context menu entry ([162c968](https://github.com/orca-team/vscode-tswagger/commit/162c9684b15e97420003a446484a148d6e7dd494))
* add extension logo ([f424df6](https://github.com/orca-team/vscode-tswagger/commit/f424df60036503c008ffb9667f9a34f28b8f10e3))
* add FetchResult type for service ([bfb4f1e](https://github.com/orca-team/vscode-tswagger/commit/bfb4f1e68748981d7fa50c1e90c82db50c7b0224))
* add help tips for `ConfigJsonForm` ([6fad783](https://github.com/orca-team/vscode-tswagger/commit/6fad7834e58b0ea9929cdf6c7ec4e64182d4a445))
* add LICENSE ([aa2a0ca](https://github.com/orca-team/vscode-tswagger/commit/aa2a0ca0f6a860ef01410564914a22925449dfc2))
* add LICENSE ([cc5ad6f](https://github.com/orca-team/vscode-tswagger/commit/cc5ad6f43f8f0ac74a5f5499c7ae9639e88f1994))
* add logo.svg ([7b0c747](https://github.com/orca-team/vscode-tswagger/commit/7b0c7477404cea5bf327f2b511da347e39b75814))
* add params & response output options ([888d28c](https://github.com/orca-team/vscode-tswagger/commit/888d28cfbbbd12506abb0f55f574dcc13c98dccc))
* add post-debug task and enhance task configurations for cleanup ([88f3bf9](https://github.com/orca-team/vscode-tswagger/commit/88f3bf97824ace1908e4a51a12c6aebc3c868542))
* add required message ([47c9abd](https://github.com/orca-team/vscode-tswagger/commit/47c9abd9530df95de59c74cd909de8a2b89d66fd))
* add success callback after saving swagger docs ([b337ebe](https://github.com/orca-team/vscode-tswagger/commit/b337ebe5ad58e9471e4d4cdfd7822af8c68d2003))
* add tooltip for def name label ([717f062](https://github.com/orca-team/vscode-tswagger/commit/717f062ba23d6ddd23f7b015bef66f425e0ef677))
* add ts file watcher ([c2e0101](https://github.com/orca-team/vscode-tswagger/commit/c2e01010b8023c842c316aa05681f3ed0134779b))
* add warning message when webview destroyed ([ad698e5](https://github.com/orca-team/vscode-tswagger/commit/ad698e523c48a6fd30670efe11ce26445263fafc))
* add warning tips for next version of swagger ([2d2d653](https://github.com/orca-team/vscode-tswagger/commit/2d2d6530a9eb94ca1cd54d2371d37ce02bb1b647))
* adjust service comments ([2e0215e](https://github.com/orca-team/vscode-tswagger/commit/2e0215ef1479823a4bdd43aac0eae7e012208c68))
* adjust the interaction of search form ([7ed37f4](https://github.com/orca-team/vscode-tswagger/commit/7ed37f4cf5f82da91d6a3938447af08e1d44aba7))
* adjust the search panel ui ([f5ff173](https://github.com/orca-team/vscode-tswagger/commit/f5ff173cfdf4b63b871629bc4e70c4f46d49ea36))
* adjust the style to indicate deprecated api ([5e55c60](https://github.com/orca-team/vscode-tswagger/commit/5e55c60f345192a7cd205c8332abb6964d87412d))
* advanced query for swagger api ([e13fb64](https://github.com/orca-team/vscode-tswagger/commit/e13fb64fe08c7ae0fa31b3837383e4eabed8faa1))
* back to top ([5d1d5f5](https://github.com/orca-team/vscode-tswagger/commit/5d1d5f51a781d499de5101b29640893dd4ad7eb7))
* beautify the AddRemoteUrlModal style ([f315684](https://github.com/orca-team/vscode-tswagger/commit/f315684c9a3e180a60cce427d169d1bcc27fb5fc))
* check fetch file ([5e018cc](https://github.com/orca-team/vscode-tswagger/commit/5e018ccd084b6d7b7110cde6e23fa8d2c24df4a1))
* check the fecth file config ([62f2d41](https://github.com/orca-team/vscode-tswagger/commit/62f2d41b0963edf9755bf3ea2dde221a2db72877))
* compare the local result and latest result in the result modal ([864629a](https://github.com/orca-team/vscode-tswagger/commit/864629a0a34e79aff12e64e0ef9853853e9878b7))
* compatible with lost tags in outermost object ([3c6762b](https://github.com/orca-team/vscode-tswagger/commit/3c6762be628f4935fc8a0b85662e143eb0484d24))
* compatible with more situations of the api definition ([fc9bb91](https://github.com/orca-team/vscode-tswagger/commit/fc9bb9127a267f07b4bcce7a0e7abc2f396c4842))
* compatible with the  `post` and `put` method which has the query params ([20b8acb](https://github.com/orca-team/vscode-tswagger/commit/20b8acbf7aae58285f80707ad095974321fb53dd))
* display swagger document information ([b220bd5](https://github.com/orca-team/vscode-tswagger/commit/b220bd5f8b86c9ed9f5ee4938a4f0b9d83169ba3))
* display the api path summary ([0e057c1](https://github.com/orca-team/vscode-tswagger/commit/0e057c1d866c59030bcbebf5acee1d5c0ce41ccb))
* enhance publish workflows with pre-release support and version verification ([728254c](https://github.com/orca-team/vscode-tswagger/commit/728254c188aa135534ee46873d782613983c8156))
* extVersion -&gt; tswagger ([0fb901a](https://github.com/orca-team/vscode-tswagger/commit/0fb901a373b284ee910485bd4eb7bc78b0db90c6))
* FileSystemSelect -&gt; DirectoryTreeSelect ([e18a525](https://github.com/orca-team/vscode-tswagger/commit/e18a5252928eb4a6bc6226d6ebdf625aaf19be8f))
* filter and translate the `definition` ([0355298](https://github.com/orca-team/vscode-tswagger/commit/03552983102340c89f47865341f9d844d8f6f326))
* fuzzy search api ([b5cbb07](https://github.com/orca-team/vscode-tswagger/commit/b5cbb07c271140ba06c79be447ad66100f90ebf3))
* generate configuration file ([c548cd3](https://github.com/orca-team/vscode-tswagger/commit/c548cd339276989f2c1379616e18052fc97fbb9d))
* generate hash for the same service name within the same group ([224b28f](https://github.com/orca-team/vscode-tswagger/commit/224b28fcf2f869f8a0595e538bc7741d9fc3e927))
* generate mapping yaml file ([26f0cbd](https://github.com/orca-team/vscode-tswagger/commit/26f0cbda675a2f0da4453cb9ebe91f9754670202))
* generate mapping yaml file ([e9e758c](https://github.com/orca-team/vscode-tswagger/commit/e9e758c9a7965e50a227bb795b3b2e9620f37cbc))
* generate multiple ts files according to different services ([6a2f45e](https://github.com/orca-team/vscode-tswagger/commit/6a2f45e44846e44f398b410b45b04a2faa142981))
* generate service ([5d954e3](https://github.com/orca-team/vscode-tswagger/commit/5d954e34dd5e6f904e33aa801f5af935529be2d3))
* generate service ([af9b88d](https://github.com/orca-team/vscode-tswagger/commit/af9b88d02da69ef4d466860f0088002e364a9be4))
* generate ts based on different `in` types ([8ea9861](https://github.com/orca-team/vscode-tswagger/commit/8ea98615bddc7f9a77667466c7fc4bdc74d6d000))
* implement @tswagger/cli with local testing and translation features ([d4407e2](https://github.com/orca-team/vscode-tswagger/commit/d4407e286bccb1ea451d02908ee5ccade32a57e8))
* improve annotation of the generated service ([6983153](https://github.com/orca-team/vscode-tswagger/commit/6983153c4764f8d1d3a9f3764ff4432253c02517))
* increase maximum apis number indicator ([58c01ae](https://github.com/orca-team/vscode-tswagger/commit/58c01ae5a15bbc024bda43052e5b2eb54b00537b))
* merge common schema ([1f85bec](https://github.com/orca-team/vscode-tswagger/commit/1f85bec038609c6f77edff2a20eec54522efe4df))
* modify the generated service result ([2934970](https://github.com/orca-team/vscode-tswagger/commit/29349705e296ba6c6d464858acf4110c6abb1eb6))
* new loading style when generating the ts result ([5400e43](https://github.com/orca-team/vscode-tswagger/commit/5400e43ba45584819ad5aa58e0e0050721421a46))
* not generate path params ts ([9683cb7](https://github.com/orca-team/vscode-tswagger/commit/9683cb7eb0ba6502850d2e3dc5b37a3f8d204e2d))
* only allow select ts/tsx file ([3f760f6](https://github.com/orca-team/vscode-tswagger/commit/3f760f67f0ebb33eaebefccfd658ffa2ac360572))
* preview and copy result in modal ([e7e3a73](https://github.com/orca-team/vscode-tswagger/commit/e7e3a733265a050559db289fc2b829640b9bb530))
* **project-config:** add project swagger URLs detection and modal UI ([41d5bb4](https://github.com/orca-team/vscode-tswagger/commit/41d5bb43a174c5addc5dfb300fa704be073913f4))
* refactor translation and type management ([c32e1c7](https://github.com/orca-team/vscode-tswagger/commit/c32e1c728c5854dddec29f0d6251e032df0db106))
* refresh swagger schema ([f8990e7](https://github.com/orca-team/vscode-tswagger/commit/f8990e7ba1ca41f7fc42bca7d8c1e5c267be0af9))
* rename `RequestParams` ts name ([cc0fafd](https://github.com/orca-team/vscode-tswagger/commit/cc0fafd5f5242c7f9750b0ee38951899a9728c7d))
* rename generated ts ([b2de9ad](https://github.com/orca-team/vscode-tswagger/commit/b2de9adad82c5a1c92f76f91ae20badf72dbf1df))
* rename webview title ([94de0ed](https://github.com/orca-team/vscode-tswagger/commit/94de0ed17e3c4e0638704334df563a6278333add))
* replace fuse.js with fuzzysort ([2a27d26](https://github.com/orca-team/vscode-tswagger/commit/2a27d26fb58e7cc96c34ac894a30c64d3016e3cc))
* send message through webviewService ([9fbb6cb](https://github.com/orca-team/vscode-tswagger/commit/9fbb6cb4a061fb5b0c42754754b6601a8939abea))
* show the progress of ts generation ([fba46ab](https://github.com/orca-team/vscode-tswagger/commit/fba46ab76ee37b825a264b8e0d630caf6cfd4234))
* support displaying whether the api has been recorded locally ([9298083](https://github.com/orca-team/vscode-tswagger/commit/9298083f61055123ca930739a33205231f3f3c3f))
* support to collapse and expand every group in the rename drawer ([db71013](https://github.com/orca-team/vscode-tswagger/commit/db7101337be479d798a151f5eba901fc1a65fb2e))
* support to hide empty group ([4c50d2a](https://github.com/orca-team/vscode-tswagger/commit/4c50d2aa56336e6f65ea07fd8a855f486e767786))
* support to map the `basePath` by adding `basePathMapping` config ([6e03741](https://github.com/orca-team/vscode-tswagger/commit/6e037412e6386e0d6fb7e22d7b880f1e03bdaf13))
* **swagger-doc:** add drag-and-drop support ([c30aa59](https://github.com/orca-team/vscode-tswagger/commit/c30aa59e67a05c69bb6567eaa2aba19c824c9fe2))
* **swagger:** add grouped document management feature ([8f42b99](https://github.com/orca-team/vscode-tswagger/commit/8f42b99955e81b4edea1b5174b7235cfc93a567c))
* **swagger:** add support for grouped swagger docs in select components ([8bf165a](https://github.com/orca-team/vscode-tswagger/commit/8bf165a3de8024d2b4dc733fb994413872216f5c))
* **SwaggerDocDrawer:** add move doc between groups functionality ([83a2b22](https://github.com/orca-team/vscode-tswagger/commit/83a2b224ebf28c0eca8605523c66b73644a6b238))
* **SwaggerDocDrawer:** implement drag-and-drop reordering for doc cards ([4e0a4b2](https://github.com/orca-team/vscode-tswagger/commit/4e0a4b223ead85fcda9aac67b7d40f821324af96))
* **SwaggerDocDrawer:** refactor document management with modal editing ([6695a29](https://github.com/orca-team/vscode-tswagger/commit/6695a294fb94413adf3e5c6b78c7805c36b0c0d7))
* synchronize the names of associated definitions ([a8fae56](https://github.com/orca-team/vscode-tswagger/commit/a8fae56c720574f9d570cd5d79ef8ffff8575d41))
* tswagger.config.json -&gt; config.json ([ac39812](https://github.com/orca-team/vscode-tswagger/commit/ac39812d9be0f3b90f609ef4d70b365620fa9623))
* **ui:** manage swagger doc URL in drawer ([aee7692](https://github.com/orca-team/vscode-tswagger/commit/aee769200e37b79baf5abfe37e3ba798a43a756a))
* unnecessary to rename `pathParamName` ([d6a68f6](https://github.com/orca-team/vscode-tswagger/commit/d6a68f64301fe57a8cd50f8fbddde83e4aeddc23))
* update initial version ([57cd561](https://github.com/orca-team/vscode-tswagger/commit/57cd5611d67cc9b89b1970c2842fa8cfea39a00e))
* update swagger url list config ([129e782](https://github.com/orca-team/vscode-tswagger/commit/129e782f9a65b4031369d095ff59df18e41fea4d))
* update the ext setting after adding new url ([281d336](https://github.com/orca-team/vscode-tswagger/commit/281d3365d7fce5a8b90ab5ab0aff34e353d6da4e))
* upgrade `bing-translate-api` to [@4](https://github.com/4).x ([479a5db](https://github.com/orca-team/vscode-tswagger/commit/479a5dbb4795fe1373eb54afd828104c38610b7a))
* use `notification` to show information uniformly ([734f159](https://github.com/orca-team/vscode-tswagger/commit/734f15977b490da5ee219601508cd07bfff0be7f))
* validate the same service name within the same group ([23ec335](https://github.com/orca-team/vscode-tswagger/commit/23ec3356a1977782f68a407b100b00a5722c8277))
* **webview:** add skeleton loader and improve page layout ([a26c001](https://github.com/orca-team/vscode-tswagger/commit/a26c001b47634af2fddb308c1e6bdaa9da54300d))
* **WebviewPage:** add CodeOutlined icon to generate TS button ([8101128](https://github.com/orca-team/vscode-tswagger/commit/81011285102bd4ae6556525845231828f5c3dcd8))
* 切换为pnpm, 增加 callService机制, 增加打开本地文件 ([d9d2f8f](https://github.com/orca-team/vscode-tswagger/commit/d9d2f8f33c46c7c1d7e4f63dc7be764af93a0b9d))
* 热更新机制微调 ([7522db5](https://github.com/orca-team/vscode-tswagger/commit/7522db5a3fa08f0e10be55d1bccf1f94eaf33b30))


### Fixed

* add File type ([07a98e1](https://github.com/orca-team/vscode-tswagger/commit/07a98e1bd5d322e0f26b8b8481dc3c5767722b86))
* add query params of the `delete` method in the path ([fc8205f](https://github.com/orca-team/vscode-tswagger/commit/fc8205f0c0e3eb1825cd9e8d06a5e1c0f0d1210a))
* **api-group:** prevent error on changing query parameters multiple times ([91fee0d](https://github.com/orca-team/vscode-tswagger/commit/91fee0de9b6e5f35a6527d7d0c10ed6e6f3351c1))
* **assets:** Clean extension logo assets ([#11](https://github.com/orca-team/vscode-tswagger/issues/11)) ([53d545e](https://github.com/orca-team/vscode-tswagger/commit/53d545edfa0eaba8bcd250c435428f45d7a45ccf))
* cannot generate correct request ts type of the `array` schema type ([f7a20d8](https://github.com/orca-team/vscode-tswagger/commit/f7a20d85c58373001663a6e2fc54221171a52007))
* cannot show the diff content after renaming the interface ([6094e66](https://github.com/orca-team/vscode-tswagger/commit/6094e6636ed079102d60227474bb4d9460427c73))
* cannot validate existed service name successfully in the rename modal ([2b12084](https://github.com/orca-team/vscode-tswagger/commit/2b12084d3e8f37e222f3ff12175e4f996b6d2c5b))
* compatible with different situations of $ref ([1f5200f](https://github.com/orca-team/vscode-tswagger/commit/1f5200fc79c052de9e82ba3b0f95b075c87cefd7))
* compatible with the `get` and `delete` method which has the request body params ([63a7819](https://github.com/orca-team/vscode-tswagger/commit/63a78194989d6341c5e7fff620f8325acf3ad6d6))
* convert formData type ([eeaa23c](https://github.com/orca-team/vscode-tswagger/commit/eeaa23ce428b2b793cae04fb6cec0cd3a9c974f4))
* convert recursive array items failed ([21f239e](https://github.com/orca-team/vscode-tswagger/commit/21f239e3ea63641233ee2a213fcbd06813ffdb91))
* deal with array type of ref ([dc16aea](https://github.com/orca-team/vscode-tswagger/commit/dc16aeafbb263c33fd324ff278eaca2820e4e43d))
* duplicate generated interface name because of the same `operationId` ([e773502](https://github.com/orca-team/vscode-tswagger/commit/e7735029a9e45d7447ad7e4f17042674b4da2b5e))
* duplicate results were generated after refresh ([b00d8b5](https://github.com/orca-team/vscode-tswagger/commit/b00d8b53daefe731225ec5649dfd7cb97f9be90e))
* **editor:** revert monaco editor loading mechanism to fix initialization issues ([a00a146](https://github.com/orca-team/vscode-tswagger/commit/a00a146cef58606a538a8a1c005bc3ad79918e14))
* export repetitive service files in the `index.ts` file ([30307a1](https://github.com/orca-team/vscode-tswagger/commit/30307a14b8103d619357c3f6dc9255598ee26011))
* extension production packaging error ([196f70a](https://github.com/orca-team/vscode-tswagger/commit/196f70ae6ba120c6d63ad9d4f1dbd2a13dea09de))
* generate interface failed beacuse of the definition which has the name with slash ([5a87997](https://github.com/orca-team/vscode-tswagger/commit/5a87997365fdad2b317fec951d1c4f7541c55d67))
* generate other interfaces failed in the same group ([acbf743](https://github.com/orca-team/vscode-tswagger/commit/acbf74346528fbd8e42520a374040753cb009de5))
* generate unique key for the api path tree ([577988a](https://github.com/orca-team/vscode-tswagger/commit/577988a5b70c8c6a048ba45092f9292b0919129a))
* generate wrong optional property ([edc7bf8](https://github.com/orca-team/vscode-tswagger/commit/edc7bf8f1a4fd56080c9ea84501af4679a7e92bd))
* generated interface name does not match ([#2](https://github.com/orca-team/vscode-tswagger/issues/2)) ([28ae92f](https://github.com/orca-team/vscode-tswagger/commit/28ae92fb7b0b3da6c54f6fe5fa1f22bc76d116f6))
* incorrect api list when selects other swagger url ([a1b0525](https://github.com/orca-team/vscode-tswagger/commit/a1b0525bb9c8f807bbb9e23337f5ec8bf3306ce3))
* incorrect import path ([3c8b6d8](https://github.com/orca-team/vscode-tswagger/commit/3c8b6d87f154cbb9a9bd386570074832b153e62b))
* incorrect notification style ([9908066](https://github.com/orca-team/vscode-tswagger/commit/9908066ff162a72648431bd24487640dea9240ae))
* incorrect response result caused by object type ([2720be4](https://github.com/orca-team/vscode-tswagger/commit/2720be4e6473e951dea7d24c9e5fce4da2d0d60b))
* incorrect translation caused by unfiltered result ([31eeff8](https://github.com/orca-team/vscode-tswagger/commit/31eeff8cef3ae89a8f4b2616eb15f238f98a0a92))
* incorrect ts result when filtered api group ([9d12d6d](https://github.com/orca-team/vscode-tswagger/commit/9d12d6d9f0f53324c7ffc4c549017c3ac42bd73b))
* incorrect ts type of path parameter ([4b8b498](https://github.com/orca-team/vscode-tswagger/commit/4b8b4987f64628846d0f4736cf01451f81b37aed))
* incorrectly use template strings in pure api path ([7a3b8b5](https://github.com/orca-team/vscode-tswagger/commit/7a3b8b5e5071d2ad671aeb64c7731bfebf7244f9))
* invalid validation for the same service name ([0f53ef6](https://github.com/orca-team/vscode-tswagger/commit/0f53ef672b71ec417db3302b2502e2c2b35c4642))
* lost definitions in complex nested object arrays ([ba6bb0c](https://github.com/orca-team/vscode-tswagger/commit/ba6bb0c373a60eb92dc4b2503aa935183a50b48a))
* missing `FormData` type in the rename modal ([9e2376a](https://github.com/orca-team/vscode-tswagger/commit/9e2376aab2d01e991bb04dfb2d2fdb9ad1c4d39d))
* missing types caused by tsType ([6c5c938](https://github.com/orca-team/vscode-tswagger/commit/6c5c938ec701dcade143a7e254fb722238fd9b35))
* **monaco:** handle editor initialization errors with retry mechanism ([5d34f1d](https://github.com/orca-team/vscode-tswagger/commit/5d34f1decb68b2b103af5ddae64996bb553992bf))
* not collect complete definitions ([ec2cf9a](https://github.com/orca-team/vscode-tswagger/commit/ec2cf9a7d1ceb8a9e5fa0e4a21f040f792bf57f1))
* not update service.map.yaml completely ([163b345](https://github.com/orca-team/vscode-tswagger/commit/163b3451519c9303d9661589324866deb70879ff))
* panel remains open after refreshing ([2db3039](https://github.com/orca-team/vscode-tswagger/commit/2db303968b5e69e84fa99a4b835b633a83e688ea))
* parameter `required` check missing ([518825a](https://github.com/orca-team/vscode-tswagger/commit/518825a699d5e87fc39dbdd53bb65bbddfb5666d))
* remove log ([7495a9a](https://github.com/orca-team/vscode-tswagger/commit/7495a9a24d8c0321ca9bcbdd052c2a8708083912))
* remove title text "1" ([c885049](https://github.com/orca-team/vscode-tswagger/commit/c8850493aa83c047aef8952b28483fe173b95114))
* result generation failure caused by state residue when changed swagger url ([2de3d91](https://github.com/orca-team/vscode-tswagger/commit/2de3d91783652f3fc328ecd60e51b317f7f5e74d))
* service files exported in the entry file end with `.ts` extension ([66b9d4d](https://github.com/orca-team/vscode-tswagger/commit/66b9d4d9f0811f01b414fc9be4676d3a7e5cd8d6))
* simplify version verification logic in publish workflow ([22b5663](https://github.com/orca-team/vscode-tswagger/commit/22b5663ba94a53e923b10b0439d6052f01d78ddd))
* specify type for childApiGroupName in ResultRenameDrawer ([b07a229](https://github.com/orca-team/vscode-tswagger/commit/b07a2292571669e6f2603afd954c6ba6f8c3a017))
* start generate ts before validating form ([50bb230](https://github.com/orca-team/vscode-tswagger/commit/50bb23068c54d3e3cf28f2e4e980d3bb6ada8ecb))
* **SwaggerDocDrawer:** fix document move functionality between groups ([c6282ea](https://github.com/orca-team/vscode-tswagger/commit/c6282ea1bd85c619148f5c7866971741ab35bd72))
* **SwaggerDocDrawer:** fix document sorting functionality ([8ac2ad7](https://github.com/orca-team/vscode-tswagger/commit/8ac2ad7441214977de103ad55dfcf90650eeabf4))
* **SwaggerDocDrawer:** improve group deletion with confirmation modal ([8fef95f](https://github.com/orca-team/vscode-tswagger/commit/8fef95f2b800c1b7956c17c4ff6e523f0a649f6d))
* **swaggerUtil:** prevent stack overflow in schema dependency collection ([a0cd06d](https://github.com/orca-team/vscode-tswagger/commit/a0cd06d30fabaed6a5bd00cdb0529a16dc28a111))
* the panel folds or opens when click the checkbox ([9693d41](https://github.com/orca-team/vscode-tswagger/commit/9693d412b1a473cb6ef4126cf0f5109e487b209d))
* the same service name conflict with the local file ([0850106](https://github.com/orca-team/vscode-tswagger/commit/085010621d4ad3444180aef6587e36df38dac6a5))
* title align center ([78927ba](https://github.com/orca-team/vscode-tswagger/commit/78927ba96591f09846c756e08bd88d3d41ee848e))
* title align center ([fa0e43c](https://github.com/orca-team/vscode-tswagger/commit/fa0e43cee440c41c27158e3e61fb6b8c712a33ee))
* typing ([5428672](https://github.com/orca-team/vscode-tswagger/commit/542867282c9b52a89c9a3a4ff1582806462d330c))
* typo ([adb7a6d](https://github.com/orca-team/vscode-tswagger/commit/adb7a6db44a7bba48db7d4702aa20c982c6207f8))
* unable to generate typescript when opens local swagger json file ([4ffba23](https://github.com/orca-team/vscode-tswagger/commit/4ffba239b57537dbcb8067c249192d92f9be2626))
* update local file failed if not renaming ([003e643](https://github.com/orca-team/vscode-tswagger/commit/003e643af40f0bcf0a8aea0120aeda9933be7269))
* v1.2.5 changelog title ([52463f4](https://github.com/orca-team/vscode-tswagger/commit/52463f4bb5326e7e0f26691176db3cabc8ad9043))
* validate renamed text ([49e5e04](https://github.com/orca-team/vscode-tswagger/commit/49e5e04595504c3bc470bf6c3bf06fac68c17080))
* **vscode:** use strict equality for token comparison in callService ([f15fc17](https://github.com/orca-team/vscode-tswagger/commit/f15fc17cdb86f32958b08e007af2e2be011e0ea2))
* **WebviewPage:** add webkit prefixes for text gradient compatibility ([194a41c](https://github.com/orca-team/vscode-tswagger/commit/194a41c5ab4a49db3e224b61419cd1c739e489c9))
* 修復翻譯接口報錯問題 ([d559415](https://github.com/orca-team/vscode-tswagger/commit/d55941593b7a32a5a611516f104207299b7173cb))


### Changed

* `keep a changelog` standard ([b998336](https://github.com/orca-team/vscode-tswagger/commit/b9983369fbc057e2a9c6780cdcca007b1cadb4c8))
* `keep a changelog` standard ([8c40b89](https://github.com/orca-team/vscode-tswagger/commit/8c40b8948c5613c24a24d37d67e2f7c7767cf52d))
* add 1.0.1 version CHANGELOG ([6aed761](https://github.com/orca-team/vscode-tswagger/commit/6aed761ed0a0f038bf20530af95ff5e5b864f19c))
* add README ([68d50be](https://github.com/orca-team/vscode-tswagger/commit/68d50be6453a8b9ce85cef8c76597ab608e1937e))
* add scripts for updating version ([61daa7c](https://github.com/orca-team/vscode-tswagger/commit/61daa7ce80e58778f504c9396f6b16bc2325e00d))
* adjust confirm tip position ([c285491](https://github.com/orca-team/vscode-tswagger/commit/c285491e55cc612f17dafe84ce7f6b171d4b38c9))
* adjust the result drawer style ([3d1115d](https://github.com/orca-team/vscode-tswagger/commit/3d1115da6606553741ff6da9b24b183c55ce772b))
* change repository url ([9552acf](https://github.com/orca-team/vscode-tswagger/commit/9552acf82750f427f12a0b0c37c9fbe0750c078c))
* **ci:** enhance publish workflow and update Dingtalk notification text generation ([03323d2](https://github.com/orca-team/vscode-tswagger/commit/03323d2870f2abac29de336b138581d3d2c8099a))
* communicate by register and call service ([250f90f](https://github.com/orca-team/vscode-tswagger/commit/250f90f0bf440c2b2e059e49a54c11d827ae8a44))
* convert params and response to ts ([0d1df6f](https://github.com/orca-team/vscode-tswagger/commit/0d1df6fa2d2bb85c58ff52b680f62f9bd63816bc))
* **eslint:** allow console info level and clean up logs ([6f559ba](https://github.com/orca-team/vscode-tswagger/commit/6f559ba657e05978d36ae4cdfc30f8e0c0b1de56))
* initial release CHANGELOG ([4bb4e77](https://github.com/orca-team/vscode-tswagger/commit/4bb4e77cd83d74af23b57874961151ec70331a87))
* Keep-a-changelog plugin added. ([5ce89b5](https://github.com/orca-team/vscode-tswagger/commit/5ce89b5d73ee8d1eb147fddc1951c067897947be))
* modify extension description ([3a9931c](https://github.com/orca-team/vscode-tswagger/commit/3a9931ce31ee93b7f7c4d5d3f3c8202e080d8525))
* **readme:** add swaggerUrls configuration example and documentation ([db3a72a](https://github.com/orca-team/vscode-tswagger/commit/db3a72ae88c42be82bcc89ed03c05f77325fbde5))
* reorganize controller file ([98a8ced](https://github.com/orca-team/vscode-tswagger/commit/98a8ced215e91596231edf7023205df449aa1c93))
* **search-suite:** improve keyword options grouping and filtering ([12abac2](https://github.com/orca-team/vscode-tswagger/commit/12abac21ecacadd378a9853860ec2375210232f0))
* shake the unused definitions ([f708e8a](https://github.com/orca-team/vscode-tswagger/commit/f708e8a9916883ef4eb6beb428d690775312f627))
* **SkeletonLoader:** simplify skeleton loader styles and component ([f1b5f41](https://github.com/orca-team/vscode-tswagger/commit/f1b5f414a09487c7e81c127f2fcf8231d7598162))
* **test:** replace esbuild bundling with custom compilation script and update test hooks ([aec3f08](https://github.com/orca-team/vscode-tswagger/commit/aec3f086d86ee0039abcfc9ad315175f9aee7f5e))
* update CHANGELOG ([1e2c92b](https://github.com/orca-team/vscode-tswagger/commit/1e2c92bb77f2d25fac5a0cd79c1ea4c711c21ec8))
* update changelog with new features ([de09252](https://github.com/orca-team/vscode-tswagger/commit/de09252ec5ab9cb4330641f1dde7abf10b93fd66))
* update changelog with recent changes ([fed5120](https://github.com/orca-team/vscode-tswagger/commit/fed5120dbfa22d311640934208dc70c4afc847c7))
* update CHANGELOG.md ([2a9d596](https://github.com/orca-team/vscode-tswagger/commit/2a9d596570c64c435cd6b35d997cc691475123f8))
* update CHANGELOG.md ([abe7bce](https://github.com/orca-team/vscode-tswagger/commit/abe7bcec69a68a3d26a81d3c57574da63dfb0ac9))
* update patch version and publish extension ([6fc9a4f](https://github.com/orca-team/vscode-tswagger/commit/6fc9a4f5279fd8467e7adc8df7f154107d1d8914))
* update README ([f1e30ec](https://github.com/orca-team/vscode-tswagger/commit/f1e30ec07df6e1db82fd2cf5d51de80760e7e500))
* update README ([86640ed](https://github.com/orca-team/vscode-tswagger/commit/86640ed023ae6c22a49b507e5e8c70d0ae74f434))
* update README ([3ac3ba0](https://github.com/orca-team/vscode-tswagger/commit/3ac3ba0edccc6f2050fd142cc979a71f63d6d96c))
* update README ([226513b](https://github.com/orca-team/vscode-tswagger/commit/226513b1a56de2de71b5db052ca46f143136a3eb))
* update README emoji ([499e466](https://github.com/orca-team/vscode-tswagger/commit/499e466e9882e8b4c235874902ffaed29a6d70a4))
* update README.md ([65ff589](https://github.com/orca-team/vscode-tswagger/commit/65ff589deed8b4afbe2baf882b8569f37188bfec))
* update README.md ([86f38b0](https://github.com/orca-team/vscode-tswagger/commit/86f38b0d2dd8ed6a878e308a218470773324a933))
* use `SwaggerUrlSelect` to manage swagger url ([806839d](https://github.com/orca-team/vscode-tswagger/commit/806839d10879e14f9aadc6d7a21e9d37091e419c))
* **webview-dev:** implement custom dev server script with dynamic port allocation and HMR fixes ([d291649](https://github.com/orca-team/vscode-tswagger/commit/d291649bcb02d13eb7a502765225aa8d72c0aff7))
* **webview:** adjust padding and remove redundant text styling ([76d4793](https://github.com/orca-team/vscode-tswagger/commit/76d4793c399856bd5ee1b3e1d35469ab6bd4b9a1))
* **WebviewPage:** improve UI consistency and replace buttons with ActionIcon ([e597f9c](https://github.com/orca-team/vscode-tswagger/commit/e597f9cb6607d371cf97ad9a6f584a6487d39baf))
* **WebviewPage:** remove unused ant-tabs and ant-checkbox styles ([6c6e0b0](https://github.com/orca-team/vscode-tswagger/commit/6c6e0b02777058c081ee85aff3c88f664f2d0d7b))
* **WebviewPage:** replace Button components with ActionIcon for consistency ([268e9bf](https://github.com/orca-team/vscode-tswagger/commit/268e9bf9769f06dc6713f3a29d7f9bb414604203))
* **webview:** remove overflow hidden and optimize layout structure ([ee697ff](https://github.com/orca-team/vscode-tswagger/commit/ee697ff3e04979fe1c0f3c9719b85d65f49bc381))
* **webview:** remove unused Components module ([ed76506](https://github.com/orca-team/vscode-tswagger/commit/ed7650673d22ad01910fcd662cd58b244de1c18d))
* **webview:** simplify development workflow by removing dev mode conditionals and using build watch ([dca3809](https://github.com/orca-team/vscode-tswagger/commit/dca3809a349b096794cbfb3812cb051b642d409e))

## [Unreleased]

## [2.5.0] - 2026-05-12

### Changed

- **Internal Refactor**: Extracted core swagger processing logic into a standalone `@tswagger/core` package and shared type definitions into `@tswagger/types`, restructuring the project as a pnpm monorepo.
- Refactored translation bridge into a dedicated `translateBridge` module, replacing the deprecated `localTranslate` module.

## [2.4.0] - 2026-04-22

### Added

- **Project Swagger URLs Detection**: Auto-detect project-level swaggerUrls configuration and display a modal on first load

### Fixed

- Fixed issue where custom group names became "未命名分组" when adding URLs to groups

## [2.3.3] - 2025-10-08

### Fixed

- Fixed error that occurred when changing query parameters multiple times in the search panel
- Resolved infinite recursion and stack overflow issues in schema dependency collection when handling deeply nested or circular schema references

## [2.3.2] - 2025-07-28

### Fixed

- Reverted Monaco Editor loading mechanism to fix initialization issues.

## [2.3.1] - 2025-07-27

### Fixed

- Monaco Editor initialization errors by updating CDN configuration.
- Document sorting functionality in SwaggerDocDrawer not working properly.
- Document move functionality from grouped to other groups not working correctly due to state update race conditions.

## [2.3.0] - 2025-07-24

### Added

- Manage swagger doc URL in drawer.
- Drag-and-drop reordering for swagger doc cards.
- Support to group swagger doc.
- Support for grouped swagger docs in select components.

### Changed

- Replace inline editing with modal-based form.
- Simplify skeleton loader styles and component.

## [2.2.1] - 2025-03-02

### Added

- Support to hide empty group.

### Fixed

- Panel remains open after refreshing.

## [2.2.0] - 2024-09-14

### Added

- Adjust the style to indicate deprecated api.
- Advanced query for swagger api.

### Changed

- Increase the maximum apis number indicator from 99+ to 999+.
- Change style for empty group.

## [2.1.1] - 2024-06-13

### Added

- Compatible with lost tags in outermost object.

## [2.1.0] - 2024-06-09

### Added

- Generate hash for the same service name within the same group.

### Fixed

- Fix incorrect ts type of path parameter.
- Invalid validation for the same service name.

## [2.0.5] - 2024-03-10

### Changed

- New loading style when generating the ts result.

## [2.0.4] - 2024-03-08

### Fixed

- Lost definitions in complex nested object arrays.

## [2.0.3] - 2024-02-28

### Fixed

- Cannot validate existed service name successfully in the rename modal.

## [2.0.2] - 2024-02-27

### Fixed

- The same service name conflict with the local file.

## [2.0.1] - 2024-02-17

### Changed

- Show the rename cancelling tips by Modal.

## [2.0.0] - 2024-02-13

### Added

- Support to collapse and expand every group in the rename drawer.
- Upgrade `bing-translate-api` to @4.x which supports using Microsoft to translate.
- Add the `translation` configuration and GUI for `tswagger`.
- Support to view the local translation cache of different translation engines.

## [1.3.4] - 2024-01-31

### Added

- Validate the same service name within the same group.

### Changed

- Modify start command title.

## [1.3.3] - 2024-01-28

### Changed

- Modify start command title.

## [1.3.2] - 2024-01-26

### Changed

- Add query params of the `delete` method in the path.

## [1.3.1] - 2024-01-26

### Fixed

- Update local file failed if not renaming.

## [1.3.0] - 2024-01-20

### Added

- Compare the local result and latest result in the result modal.

### Changed

- Compatible with more situations of the api definition.

## [1.2.8] - 2024-01-14

### Fixed

- Duplicate results were generated after refresh.

## [1.2.7] - 2024-01-11

### Changed

- Unnecessary to rename `pathParamName`.

## [1.2.6] - 2024-01-10

### Changed

- Error notification will be closed after 5 seconds.

### Fixed

- Generate interface failed beacuse of the definition which has the name with slash.

## [1.2.5] - 2024-01-10

## [1.2.4] - 2024-01-03

### Fixed

- Compatible with the `get` and `delete` method which has the request body params.

## [1.2.3] - 2024-01-01

### Fixed

- The service files exported in the entry file end with `.ts` extension.

## [1.2.2] - 2023-12-31

### Added

- Support displaying whether the api has been recorded locally.

### Fixed

- Export repetitive service files in the `index.ts` file.

## [1.2.1] - 2023-12-20

### Changed

- Modify the result modal title.

## [1.2.0] - 2023-12-19

### Added

- Support to map the `basePath` by adding `basePathMapping` config.

### Fixed

- Cannot generate correct request ts type of the `array` schema type.

## [1.1.1] - 2023-12-17

### Fixed

- Cannot show the diff content after renaming the interface.

## [1.1.1] - 2023-12-15

### Fixed

- Cannot rename the interface.

## [1.1.0] - 2023-12-15

### Changed

- Compatible with the `post` and `put` method which has the query params.

### Fixed

- Duplicate generated interface name because of the same `operationId`.
- Missing `FormData` type in the rename modal.

## [1.0.9] - 2023-12-13

### Fixed

- Generate wrong optional property.

## [1.0.8] - 2023-12-12

### Fixed

- Generate other interfaces failed in the same group.

## [1.0.7] - 2023-12-12

### Fixed

- Missing types caused by tsType.

## [1.0.6] - 2023-12-12

### Fixed

- Convert recursive array items failed.

## [1.0.5] - 2023-09-05

### Fixed

- Generated interface name does not match ([#2](https://github.com/orca-team/vscode-tswagger/issues/2)).

## [1.0.4] - 2023-09-04

### Fixed

- Unable to generate typescript when opens local swagger json file

## [1.0.3] - 2023-08-22

### Added

- Keep-a-changelog plugin added.

## [1.0.2]

### Added

- add `standard-version`

## [1.0.1]

### Added

- add publish workflows

## [1.0.0]

### Added

- Initial release
