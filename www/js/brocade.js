// Js class to interface with Brocade API https://www.brocade.io/
// Written by Britton Scritchfield on the behlaf of X² Labs http://www.x2labs.com/
class brocadeWrapper
{
    constructor(options)
    {
        if (typeof options === 'undefined')
        {
            throw 'Error options must be defined: brocade.js';
        }

        if (typeof options.containerEl === 'undefined')
        {
            throw 'Error options.containerEl must be defined: brocade.js';
        }

        this.debug = false;

        this.containerEl = options.containerEl;

        this.brocadeInnerWrapper;
        this.initWrapper();

        this.barcodeItemArray = [];
        this.currentItem;
        this.currentItemUPC = '';

        this.getLookupInterface();
    }

    initWrapper()
    {
        let tempEl = document.createElement('div');
        x2.ajax(
            {
                url: 'templates/brocadeInnerWrapper.html',
                dataType: 'json',
                method: 'GET',
                success: function (response)
                {
                    tempEl.innerHTML = response;
                }.bind(this),
                error: function ()
                {
                }
            });

        this.containerEl.innerHTML = tempEl.innerHTML;
        this.brocadeInnerWrapper = this.containerEl.querySelector('.brocadeInnerWrapper');

        let brocadeNav = this.containerEl.querySelector('.brocadeNav');

        brocadeNav.querySelector('.backToLookup').addEventListener('click', function ()
        {
            this.getLookupInterface();
        }.bind(this));
        brocadeNav.querySelector('.backToList').addEventListener('click', function ()
        {
            this.getListItemsInterface();
        }.bind(this));
        brocadeNav.querySelector('.backToItem').addEventListener('click', function ()
        {
            this.getItemDisplay();
        }.bind(this));
    }

    getLookupInterface()
    {
        let tempEl = document.createElement('div');
        x2.ajax(
        {
            url: 'templates/brocadeLookup.html',
            dataType: 'json',
            method: 'GET',
            success: function (response)
            {
                tempEl.innerHTML = response;
            }.bind(this),
            error: function ()
            {
            }
        });

        this.brocadeInnerWrapper.innerHTML = tempEl.innerHTML;

        document.querySelector('.barcodeLookupTextBtn').addEventListener('click', function ()
        {
            this.getListItemsData(document.querySelector('.barcodeTextSearch').value);
        }.bind(this));

        document.querySelector('.barcodeLookupScanBtn').addEventListener('click', function ()
        {
            this.scan();
        }.bind(this));
    }

    scan()
    {
        cordova.plugins.barcodeScanner.scan(
            function (result)
            {
                this.currentItemUPC = result.text;
                this.getItem();
            }.bind(this),
            function (error)
            {
            },
            {
                preferFrontCamera: false, // iOS and Android
                showFlipCameraButton: true, // iOS and Android
                showTorchButton: true, // iOS and Android
                torchOn: false, // Android, launch with the torch switched on (if available)
                saveHistory: false, // Android, save scan history (default false)
                prompt: "Place a barcode inside the scan area", // Android
                resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                formats: "UPC_A,UPC_E,CODE_39,upc_EAN_EXTENSION", //DATA_MATRIX,UPC_A,UPC_E,CODE_39 // default: all but PDF_417 and RSS_EXPANDED
                orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
                disableAnimations: true, // iOS
                disableSuccessBeep: false // iOS and Android
            }
        );
    }

    getListItemsInterface()
    {
        if (this.barcodeItemArray.length <= 0)
        {
            this.getLookupInterface();

            return;
        }

        this.brocadeInnerWrapper.innerHTML = '';

        let tempEl = document.createElement('div');
        x2.ajax(
            {
                url: 'templates/brocadeListItem.html',
                dataType: 'json',
                method: 'GET',
                success: function (response)
                {
                    tempEl.innerHTML = response;
                }.bind(this),
                error: function ()
                {
                }
            });

        for (var i = 0; i < this.barcodeItemArray.length; i++)
        {
            let barcodeItem = document.createElement('div');
            barcodeItem.innerHTML = tempEl.innerHTML;
            barcodeItem = barcodeItem.firstChild;

            for (var x = 0; x < Object.keys(this.barcodeItemArray[i]).length; x++)
            {
                let item = barcodeItem.querySelector('.' + Object.keys(this.barcodeItemArray[i])[x]);
                if (item !== null)
                {
                    item.innerHTML = this.barcodeItemArray[i][Object.keys(this.barcodeItemArray[i])[x]];

                    if (Object.keys(this.barcodeItemArray[i])[x] === 'gtin14')
                    {
                        let currentItem = this.barcodeItemArray[i];
                        item.addEventListener('click', function ()
                        {
                            this.currentItemUPC = item.innerHTML;
                            this.getItem();
                        }.bind(this));
                    }
                }
            }

            this.brocadeInnerWrapper.appendChild(barcodeItem);
        }
    }

    getListItemsData(searchTerm)
    {
        while (searchTerm.includes('  '))
        {
            searchTerm = searchTerm.replace('  ', '');
        }

        while (searchTerm.includes(' '))
        {
            searchTerm = searchTerm.replace(' ', '-');
        }

        let upcData = '';

        if (!this.debug)
        {
            // https://www.brocade.io/api/items?query=peanut+butter
            // https://www.brocade.io/api/items?query=peanut+butter&page=3
            // https://www.brocade.io/api/items

            x2.ajax(
                {
                    url: 'https://www.brocade.io/api/items?query=' + searchTerm,
                    dataType: 'json',
                    method: 'GET',
                    success: function (response)
                    {
                        upcData = response.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t").replace("'", '&apos;');
                    }.bind(this),
                    error: function ()
                    {
                    }
                });            
        }
        else
        {
            upcData = '[{"gtin14":"00041500000312","brand_name":"French&apos;s","name":"Classic Yellow Mustard","fat":"0.0","size":"20 oz","sodium":"55","protein":"0","calories":"0","trans_fat":"0.0","cholesterol":"0","ingredients":"Distilled vinegar, water, #1 grade mustard seed, salt, turmeric, paprika, spice, natural flavors and garlic powder.","carbohydrate":"0","serving_size":"1 tsp(5g)","saturated_fat":"0.0","servings_per_container":"113"},{"gtin14":"00041220985777","brand_name":"H.E.B.","name":"Honey Mustard","fat":"0.0","size":"12oz(340g)","fiber":"1","sodium":"30","sugars":"0","calories":"5","carbohydrate":"1","serving_size":"1tsp(5g)","servings_per_container":"68"},{"gtin14":"00092325333321","brand_name":"Annie&apos;s","name":"Natural Balsamic Vinaigrette","fat":"10.0","size":"8 fl oz","sodium":"55","sugars":"2","protein":"0","calories":"100","ingredients":"WATER, EXPELLER PRESSED VEGETABLE OIL (CANOLA AND/OR SUNFLOWER), BALSAMIC VINEGAR, HONEY, STONE GROUND MUSTARD (DISTILLED WHITE VINEGAR, WATER, MUSTARD SEED, SEA SALT, ALLSPICE, CINNAMON), SEA SALT, XANTHAN GUM.","carbohydrate":"2","serving_size":"2 tbsp","saturated_fat":"1.0","servings_per_container":"About 8"},{"gtin14":"00605388187796","brand_name":"Great Value","name":"Yellow Mustard","size":"24 oz"},{"gtin14":"00041500829272","brand_name":"French&apos;s","name":"Honey Mustard Dipping Sauce","size":"12 oz"},{"gtin14":"00021000028207","brand_name":"Kraft","name":"Honey Mustard Dressing","size":"16 fl oz"},{"gtin14":"00040100002573","brand_name":"Spice Islands","name":"Ground Mustard","size":"1.8 oz"},{"gtin14":"00667803000707","brand_name":"Coleman&apos;s","name":"Mustard Powder","size":"2 oz"},{"gtin14":"00052100002538","brand_name":"McCormick","name":"Ground Mustard","size":"0.85 oz"},{"gtin14":"00032251019241","brand_name":"Family Gourmet","name":"100% Natural Yellow Mustard","size":"20 oz"},{"gtin14":"00041498158705","brand_name":"Burman&apos;s","name":"All Natural Yellow Mustard","size":"14 oz"},{"gtin14":"00021130477487","brand_name":"Safeway","name":"Dijon Mustard","size":"12 oz"},{"gtin14":"00041500000251","brand_name":"French&apos;s","name":"Classic Yellow Mustard","size":"14 oz"},{"gtin14":"00050700213620","brand_name":"Hy Top","name":"Yellow Mustard","size":"20 oz"},{"gtin14":"00041500000992","brand_name":"French&apos;s","name":"Dijon Mustard","size":"041500000992"},{"gtin14":"00637405988277","brand_name":"Jenya Industry","name":"Macho Mustard BHEL","fat":"23.5","fiber":"1","sodium":"90","sugars":"2","protein":"8","calories":"488","trans_fat":"0.0","cholesterol":"0","carbohydrate":"61","saturated_fat":"9.0","monounsaturated_fat":"9.5","polyunsaturated_fat":"2.0","servings_per_container":"100 gm"},{"gtin14":"00787099474409","brand_name":"Kamadhenu","name":"Mustard","size":"50g"},{"gtin14":"00787099474416","brand_name":"Kamadhenu","name":"Mustard","size":"100g"},{"gtin14":"00787099474423","brand_name":"Kamadhenu","name":"Mustard","size":"500g"},{"gtin14":"00041220031658","brand_name":"Hill Country Fare","name":"Mustard Potato Salad","fat":"11.0","size":"48 oz(1.36k)","fiber":"2","sodium":"410","sugars":"6","protein":"2","calories":"190","trans_fat":"0.0","cholesterol":"20","carbohydrate":"20","fat_calories":"100","serving_size":"4 oz(113g)","saturated_fat":"1.5","servings_per_container":"12"},{"gtin14":"06270022133015","brand_name":"Americana Quality","name":"Chicken Kabab","fat":"3.0","size":"420g","fiber":"30","sodium":"21","sugars":"6","protein":"11","calories":"191","cholesterol":"22","ingredients":"Chicken, Water, Onion, Bread Crumbs, Cron flour, Herbs, Mustard, Soya Sauce, Salt, Spices, Lemon Juice and vinegar","carbohydrate":"34","fat_calories":"27","serving_size":"70g","saturated_fat":"2.5","servings_per_container":"6"},{"gtin14":"06271100330456","brand_name":"MF","name":"Thousand island Dressing","fat":"1.0","size":"473 ml","fiber":"0","sodium":"184","sugars":"6","protein":"0","calories":"40","potassium":"0","trans_fat":"0.0","cholesterol":"6","ingredients":"water, high fructse corn syrup, relish(cucumber, corn syrup, vinegar, salt, alum, natural flavors, polysorbate 80, turmeric), non hydrogenated soy oil, tomato paste, mustard(vinegar, salt, dried egg yolk, xanthan gum, dried garlic, white color(titanium dioxide), chili pepper, mustard flavour, dried onion, sodium benzoate as preservative, calcium disodium EDTA to protect freshness, spices, natural spices, natural spice extractives.\r\ncontains: egg","carbohydrate":"7","fat_calories":"15","serving_size":"2 tablespoons","saturated_fat":"0.0","servings_per_container":"16"},{"gtin14":"06271100330128","brand_name":"MF","name":"French Dressing fat free","fat":"0.0","size":"473ml","fiber":"0","sodium":"297","sugars":"5","protein":"0","calories":"20","potassium":"4","trans_fat":"0.0","cholesterol":"3","ingredients":"WATER, HIGH FRUCTOSE CORN SYRUP, DISTILLED VINEGAR, MODIFIED FOOD STARCH, SALT, DRIED EGG YOLK, MUSTARD FLOUR, PAPRIKA, XANTHAN GUM(A NATURAL FOOD FIBER), GARLIC, ONION PAPRIKA EXTRACTIVE, SODIUM BENZOATE AND POTASSIUM, SORBATE AS PRESERVATIVES, CITRIC ACID, CALCIUM DISODIUM EDTA(TO PROTECT QUALITY), SPICE\r\n * ADDS A TRIVAL AMOUNT OF FAT\r\n ** DRIED\r\nCONTAINS: EGG","carbohydrate":"5","fat_calories":"0","serving_size":"2 tablespoons","saturated_fat":"0.0","servings_per_container":"16"},{"gtin14":"00085239407585","brand_name":"Market Pantry","name":"Dijon Mustard","size":"12 oz"},{"gtin14":"00070080000061","brand_name":"Plochman&apos;s","name":"Mild Yellow Mustard","size":"24 oz"},{"gtin14":"00070281000297","brand_name":"Koops&apos; Mustard","name":"Honey Mustard","size":"12 oz"},{"gtin14":"09501066916362","brand_name":"Delicio","name":"Mustard Mayonnaise","size":"300 ml"},{"gtin14":"00041500007007","brand_name":"French&apos;s","name":"Classic Yellow Mustard","size":"8 oz"},{"gtin14":"00041500010403","brand_name":"French&apos;s","name":"Spicy Brown Mustard"},{"gtin14":"00041500820453","brand_name":"French&apos;s","name":"Spicy Brown Mustard 100% Natural"},{"gtin14":"00041500000428","brand_name":"French&apos;s","name":"Spicy Brown Mustard"},{"gtin14":"00041500784106","brand_name":"French&apos;s","name":"Horseradish Mustard"},{"gtin14":"00077975022085","brand_name":"Snyder&apos;s HK","name":"Honey Mustard \u0026 Onion Pretzel Pieces","size":"56g"},{"gtin14":"08909930509848","brand_name":"MAH Masala@Health","name":"Rasam powder","size":"100gm","ingredients":"Mustard, Turmeric, Red Chillies, Coriander Seed, Meethi, Jeera, Pepper"},{"gtin14":"00787099474430","brand_name":"Kamadhenu","name":"Mustard Urid Mix","size":"50g"},{"gtin14":"00787099474447","brand_name":"Kamadhenu","name":"Mustard Urid Mix","size":"100g"},{"gtin14":"00000050157365","brand_name":"Heinz","name":"American Mustard Honey","size":"220ml"},{"gtin14":"00041220985685","brand_name":"H.E.B.","name":"Yellow Mustard","fat":"0.0","size":"8 oz(227g)","sodium":"80","protein":"0","calories":"0","carbohydrate":"0","serving_size":"1tsp(5g)","servings_per_container":"45"},{"gtin14":"00000050147311","brand_name":"Colmans","name":"English Mustard","size":"100g"},{"gtin14":"0010481001007","brand_name":null,"name":"Hot Sweet Mustard","weight_g":269,"unit_count":1,"weight_ounce":9.5},{"gtin14":"0010481002004","brand_name":null,"name":"Napa Valley Mustard Whole Grained","weight_g":233,"unit_count":1,"weight_ounce":8.25},{"gtin14":"0010481004008","brand_name":null,"name":"Dijon Mustard","weight_g":241,"unit_count":1,"weight_ounce":8.5},{"gtin14":"0011110682888","brand_name":"Kroger","name":"Mustard Seed","weight_g":74,"unit_count":1,"weight_ounce":2.62},{"gtin14":"0011110682963","brand_name":"Kroger","name":"Mustard","weight_g":38,"unit_count":1,"weight_ounce":1.37},{"gtin14":"0011110808400","brand_name":"Kroger","name":"Mustard Dijon With Horseradish","weight_g":255,"unit_count":1,"weight_ounce":9},{"gtin14":"0011110810885","brand_name":"Kroger","name":"Mustard Dijon","unit_count":1,"weight_ounce":12},{"gtin14":"0011110820846","brand_name":"Kroger","name":"Organic Mustard","weight_g":255,"unit_count":1,"weight_ounce":9},{"gtin14":"0011110830708","brand_name":"Kroger","name":"Mustard Yellow","weight_g":453,"unit_count":1,"weight_ounce":16},{"gtin14":"0011110844064","brand_name":"Kroger","name":"Mustard Yellow","weight_g":680,"unit_count":1,"weight_ounce":24},{"gtin14":"0011110844088","brand_name":"Kroger","name":"Mustard Yellow","weight_g":297,"unit_count":1,"weight_ounce":10.5},{"gtin14":"0011110844132","brand_name":"Kroger","name":"Mustard Spicy Brown","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0011110844156","brand_name":"Kroger","name":"Mustard Horseradish","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0011110844248","brand_name":"Kroger","name":"Mustard Honey","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0011110872111","brand_name":"Kroger","name":"Mustard Spicy Brown","weight_g":680,"unit_count":1,"weight_ounce":24},{"gtin14":"0011152025391","brand_name":"JFC International Inc.","name":"Chinese - style Mustard Extra Hot","unit_count":1,"weight_ounce":4},{"gtin14":"0011209002085","brand_name":null,"name":"Pure Prepared Mustard","weight_g":227,"unit_count":1,"weight_ounce":8},{"gtin14":"0011209002207","brand_name":null,"name":"Pure Prepared Mustard","unit_count":1,"weight_ounce":20},{"gtin14":"0011209002245","brand_name":null,"name":"Pure Prepared Mustard","unit_count":1,"weight_ounce":24},{"gtin14":"0011209002801","brand_name":null,"name":"Pure Prepared Mustard","unit_count":1,"volume_fluid_ounce":64},{"gtin14":"0011209003150","brand_name":null,"name":"Deli Style Mustard","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0011209003662","brand_name":null,"name":"German Mustard With White Wine","weight_g":227,"unit_count":1,"weight_ounce":8},{"gtin14":"0011209003884","brand_name":null,"name":"Mustard Stoneground","unit_count":1,"volume_fluid_ounce":128},{"gtin14":"0011210023604","brand_name":"Tabasco","name":"Hot Mustard Coarse Ground","unit_count":1,"weight_ounce":9},{"gtin14":"0011210023659","brand_name":"Tabasco","name":"Hot Mustard Spicy Brown","unit_count":1,"weight_ounce":9},{"gtin14":"0011216287468","brand_name":null,"name":"Ground Mustard Spice","unit_count":1,"weight_ounce":1.75},{"gtin14":"0011225022135","brand_name":"Valu time","name":"Mustard","weight_g":454,"unit_count":1,"weight_ounce":16},{"gtin14":"0011225056314","brand_name":"World Classics Trading Company","name":"Mustard Dijon","weight_g":269,"unit_count":1,"weight_ounce":9.5},{"gtin14":"0011225056321","brand_name":"World Classics Trading Company","name":"Mustard With Horseradish","weight_g":269,"unit_count":1,"weight_ounce":9.5},{"gtin14":"0011225056369","brand_name":"World Classics Trading Company","name":"Mustard Sweet \u0026 Hot Honey","weight_g":290,"unit_count":1,"weight_ounce":10.25},{"gtin14":"0011246201540","brand_name":"Robert Rothschild Farm","name":"Raspberry Honey Mustard Pretzel Dip","unit_count":1,"weight_ounce":13.5},{"gtin14":"0011246233541","brand_name":"Robert Rothschild Farm","name":"Champagne Garlic Honey Mustard Pretzel Dip","weight_g":382,"unit_count":1,"weight_ounce":13.5},{"gtin14":"0011246244547","brand_name":"Robert Rothschild Farm","name":"Blackberry Honey Mustard Pretzel Dip","weight_g":383,"unit_count":1,"weight_ounce":13.5},{"gtin14":"0011246513551","brand_name":"Robert Rothschild Farm","name":"Raspberry Honey Mustard","weight_g":326,"unit_count":1,"weight_ounce":11.5},{"gtin14":"0011246529552","brand_name":"Robert Rothschild Farm","name":"Raspberry Wasabi Dipping Mustard","weight_g":263,"unit_count":1,"weight_ounce":9.3},{"gtin14":"0011246532552","brand_name":"Robert Rothschild Farm","name":"Anna Mae&apos;s Smoky Mustard","unit_count":1,"weight_ounce":9.2},{"gtin14":"0011246539551","brand_name":"Robert Rothschild Farm","name":"Mustard Blue Cheese Dijon Gluten Free","weight_g":272,"unit_count":1,"weight_ounce":9.6},{"gtin14":"0011246540557","brand_name":"Robert Rothschild Farm","name":"Tarragon Peppercorn Mustard","weight_g":244,"unit_count":1,"weight_ounce":8.6},{"gtin14":"0011246541554","brand_name":"Robert Rothschild Farm","name":"Cilantro Jalapeno Mustard","weight_g":264,"unit_count":1,"weight_ounce":9.3},{"gtin14":"0011246542551","brand_name":"Robert Rothschild Farm","name":"Cranberry Pomegranate Mustard","weight_g":292,"unit_count":1,"weight_ounce":10.3},{"gtin14":"0012354071070","brand_name":null,"name":"Mustard Seed Yellow Mexican Spice","unit_count":1,"weight_ounce":0.5},{"gtin14":"0012354071094","brand_name":null,"name":"Mustard Seed Yellow Mexican Spice","unit_count":1,"weight_ounce":0.5},{"gtin14":"0013000006453","brand_name":"Heinz","name":"Spicy Brown Mustard","unit_count":1,"weight_ounce":17.5},{"gtin14":"0013000006484","brand_name":"Heinz","name":"Yellow Mustard","unit_count":1,"weight_ounce":17.85},{"gtin14":"0013000425070","brand_name":"Heinz","name":"Yellow Mustard","unit_count":1},{"gtin14":"0013000514002","brand_name":"Heinz","name":"Dijon Mustard Bottle Case Pack 60","unit_count":1},{"gtin14":"0013000524605","brand_name":"Heinz","name":"Honey Mustard Dip Dipping Cups","unit_count":1,"weight_ounce":2},{"gtin14":"0013000530606","brand_name":"Heinz","name":"Heinz Mild Mustard 200 Case","unit_count":1},{"gtin14":"0013000534291","brand_name":"Heinz","name":"Honey Mustard Dressing Pouches","weight_g":42,"unit_count":1,"weight_ounce":1.5},{"gtin14":"0013000652209","brand_name":"Heinz","name":"Yellow Mustard","unit_count":1,"weight_ounce":104},{"gtin14":"0015400191456","brand_name":null,"name":"Mustard","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0015400191463","brand_name":null,"name":"Mustard","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0015400191470","brand_name":null,"name":"Mustard","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0015400859035","brand_name":"Shur Fine","name":"Honey Mustard","weight_g":340,"unit_count":1,"weight_ounce":12},{"gtin14":"0015532232126","brand_name":null,"name":"Cucumber Garlic And Dill Mustard 11 lb","unit_count":1},{"gtin14":"0016000413115","brand_name":"General Mills","name":"Whole Grain Chicken Helper Honey Mustard Chicken","unit_count":1,"weight_ounce":6.5},{"gtin14":"0016291441309","brand_name":"Morton \u0026 Bassett","name":"Brown Mustard Seed","unit_count":1,"weight_ounce":2.7},{"gtin14":"0017000083353","brand_name":null,"name":"Armour Honey Mustard Flavor Vienna Sausage","weight_g":142,"unit_count":1,"weight_ounce":5},{"gtin14":"0018325000582","brand_name":null,"name":"Mustard Dijon 8.5","unit_count":1},{"gtin14":"0019186002135","brand_name":null,"name":"Cranberry Mustard 4 Unit Pack","unit_count":1,"weight_ounce":10},{"gtin14":"0020023040814","brand_name":"Jim Beam","name":"Bacon Mustard","unit_count":1,"weight_ounce":11}]';
            upcData = upcData.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t").replace("'", '&apos;');
        }

        if (upcData && upcData.length > 0)
        {
            upcData = JSON.parse(upcData);
        }
        else
        {
            this.getLookupInterface();
        }

        this.barcodeItemArray = [];
        for (var i = 0; i < upcData.length; i++)
        {
            this.barcodeItemArray.push(Object.assign(new barcodeItem, upcData[i]));
        }

        if (this.barcodeItemArray.length > 0)
        {
            this.getListItemsInterface();
        }
        else
        {
            this.getLookupInterface();
        }
    }

    getItem()
    {
        while (this.currentItemUPC.includes(' '))
        {
            this.currentItemUPC = this.currentItemUPC.replace(' ', '');
        }

        //alert(this.currentItemUPC);

        if (this.currentItemUPC.length <= 0)
        {
            if (this.barcodeItemArray.length > 0)
            {
                this.getListItemsInterface();
            }
            else
            {
                this.getLookupInterface();
            }
        }

        if (!this.debug)
        {
            // https://www.brocade.io/api/items/000000000000
            // https://www.brocade.io/api/items/00074887615305

            x2.ajax(
                {
                    url: 'https://www.brocade.io/api/items/' + this.currentItemUPC,
                    dataType: 'json',
                    method: 'GET',
                    success: function (response)
                    {
                        this.currentItem = response.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t").replace("'", '&apos;');;
                    }.bind(this),
                    error: function ()
                    {
                    }
                });
        }
        else
        {
            this.currentItem = '{"gtin14":"00070100016669","brand_name":"John Morrell","name":"Rath Black Hawk Hot Dogs","fat":"13.0","size":"12oz (340g)","fiber":"0","sodium":"550","sugars":"3","protein":"4","calories":"150","trans_fat":"0.0","cholesterol":"35","carbohydrate":"4","fat_calories":"120","serving_size":"1 frank","saturated_fat":"4.5","servings_per_container":"8"}';
        }

        if (this.currentItem && this.currentItem.length > 0)
        {
            this.currentItem = JSON.parse(this.currentItem);
            this.currentItem = Object.assign(new barcodeItem, this.currentItem);
            this.getItemDisplay();
        }
        else
        {
            if (this.barcodeItemArray.length > 0)
            {
                this.getListItemsInterface();
            }
            else
            {
                this.getLookupInterface();
            }
        }
    }

    getItemDisplay()
    {
        this.brocadeInnerWrapper.innerHTML = '';

        let tempEl = document.createElement('div');
        x2.ajax(
            {
                url: 'templates/brocadeItemDisplay.html',
                dataType: 'json',
                method: 'GET',
                success: function (response)
                {
                    tempEl.innerHTML = response;
                }.bind(this),
                error: function ()
                {
                }
            });

        this.brocadeInnerWrapper.innerHTML = tempEl.innerHTML;

        if (typeof this.currentItem !== 'object')
        {
            if (this.barcodeItemArray.length > 0)
            {
                this.getListItemsInterface();
            }
            else
            {
                this.getLookupInterface();
            }

            return;
        }

        for (var x = 0; x < Object.keys(this.currentItem).length; x++)
        {
            let item = this.brocadeInnerWrapper.querySelector('.' + Object.keys(this.currentItem)[x]);
            if (item !== null)
            {
                item.innerHTML = this.currentItem[Object.keys(this.currentItem)[x]];
            }
        }
    }
}

class barcodeItem
{
    constructor()
    {
        this.gtin14 = '';
        this.brand_name = '';
        this.name = '';
        this.fat = '';
        this.size = '';
        this.fiber = '';
        this.sodium = '';
        this.sugars = '';
        this.protein = '';
        this.calories = '';
        this.potassium = '';
        this.cholesterol = '';
        this.ingredients = '';
        this.carbohydrate = '';
        this.fat_calories = '';
        this.serving_size = '';
        this.saturated_fat = '';
        this.trans_fat = '';
        this.monounsaturated_fat = '';
        this.polyunsaturated_fat = '';
        this.servings_per_container = '';
        this.pages = '';
        this.author = '';
        this.format = '';
        this.publisher = '';
        this.alcohol_by_volume = '';
        this.alcohol_by_weight = '';
        this.volume_fluid_ounce = '';
        this.volume_ml = '';
        this.weight_g = '';
        this.weight_ounce = '';
        this.unit_count = '';
    }
}