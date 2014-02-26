//var $server = 'http://sahajayogamp.com/d6/';
//var $PSserver = 'http://sahajayogamp.com/d6/';
var $PSserver = 'http://www.planetseed.com/';
var $server = 'http://www.planetseed.com/';
var ajaxing = false;
var fetchdata = false;

var category = '';
var loadCategory = false;
var qSubmit = false;
var qSubmitSuccess = false;

var Application = {

    initApplication: function () {
        $(document)
            .on('pageinit', '#home-page', function () {
                //   Application.initHomePage();   
            })
            .on('pageinit', '#browsetopic-page', function () {
                Application.initCategoryPage();
            })
            .on('pagebeforeshow', '#browsetopic-page', function () {
                if (loadCategory == false)
                    Application.initCategoryPage();
            })   
        
            .on('pageinit', '#asktheexpert-page', function () {
                //   Application.initCategoryPage();
            })
            .on('pagebeforeshow', '#atx-form-page', function () {
                $('#atx-country').selectmenu("refresh");
                $('#atx-age').selectmenu("refresh");
                qSubmit = false;
            })
            .on('pageinit', '#atx-form-page', function () {
                qSubmit = false;
                Application._getDbValues();
                //    Application.initAtxFormPage(); 
            })
            .on('pageinit', '#faq-detail-page-ext', function () {
                $('#faq-detail-page-ext .content').html($('#faq-detail-page .content').html());
                $.mobile.activePage.trigger("refresh");  
            })
        ;
        document.addEventListener("backbutton", function(e) {
            if ($.mobile.activePage.is('#home-page')) {
                e.preventDefault();
                navigator.app.exitApp();
            } else {
                navigator.app.backHistory()
            }
        }, false);
    },

    loadApplication: function () {
        //    Application.updateIcons();
        Application.loadCountry();
        Application.loadAge();
        
        //   Application.initCategoryPage();
        Application.initAtxFormPage();
        Application.initQuestionPage();
       
        if (isDevice === true) {
            navigator.splashscreen.hide();
        }
       
        $(".btnclose").on("tap", function() {
            navigator.app.exitApp();
        });
        
        $(document).bind("mobileinit", function () {
            $.mobile.defaultPageTransition = 'none';
            $.mobile.defaultDialogTransition = 'none';
            $.mobile.buttonMarkup.hoverDelay = 0;
        });
        
        $(document).on("change", '#app-language', function(event) {
            loadCategory = false;
            Application.initCategoryPage();
        });
        $('#homeAskBtn').click(function() {
            return Application.checkConnection();
        });
        $('#homeBrowseBtn').click(function() {
            return Application.checkConnection();
        });
    },


  

    initAtxFormPage: function () {
        $('#atx-form').submit(function (event) {
            if (! Application.checkConnection())
                return;

            event.preventDefault();
            var data = Application._setDbValues();
            console.log(data);
            if (typeof(data) == 'boolean')
                return false;
            
            if (qSubmit == true) {
                navigator.notification.alert('Submitting is in progress', function () {
                }, 'Error');
                return;
            }    
            qSubmit = true;     
            qSubmitSuccess = false;
            var url = $server + 'services/atx_tktsubmit';
            $.ajax({
                       url: url,
                       type: 'post',
                       crossDomain: true,
                       data: data,
                       success: function(data) {
                           if (data["success"] == 1) {
                               if (isDevice != true) {
                                   $('#verifyurl').html('<a href="' + data["verifyurl"] + '" target="_blank">verify</a>');
                               }
                               $('#atx-questionform')[0].reset();
                               qSubmitSuccess = true;
                           } else {
                               qSubmitSuccess = false;
                               navigator.notification.alert('Invalid value', function () {
                               }, 'Error');
                           }
                       },
                       complete: function () {
                           $.mobile.loading('hide');
                           qSubmit = false;
                           console.log('Question submitted:ajax Complete');
                           if (qSubmitSuccess == true) {
                               $.mobile.changePage("#atx-success-page", { transition: "slide", changeHash: false });
                           }                           
                       },

                       beforeSend: function() {
                           $.mobile.loading('show');
                       },
                       error: function(data) {
                           console.log(data)
                           navigator.notification.alert('ERROR OCCURRED!', function () {
                           }, 'Error');
                       }
                   });
            return false;
        });
    },


    initQuestionPage: function () {
        if (! Application.checkConnection())
            return;
        
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_ticketcategory/' + $lng ;
        var quesOpt = '<option value="" selected>Select category<\/option>';
        $.ajax({
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:5000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       console.log('Ticket Category:ajax Complete');
                   },
                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Ticket Category not found.', function () {
                           }, 'Error');
                           return;
                       }
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               quesOpt += '<option value="' + value.tid + '" >' + value.name + '<\/option> ';
                           });
                       });
                       $('#atx-question-category').empty();
                       $('#atx-question-category').append(quesOpt);
                       console.log(data);
                   },
                   error: function (e) {
                       console.log(e.message);
                   }
               });    
        
        //question submit
               
        $('#atx-questionform').submit(function (event) {
            var data = { };
            data['question'] = $('#atx-question').val().trim(); 
            data['category'] = $('#atx-question-category').val().trim();  
            if (data['category'] === '') {
                navigator.notification.alert('Invalid Category, Please select question category', function () {
                }, 'Error');
                return false;
            }              
            if (data['question'] === '') {
                navigator.notification.alert('Question is required and cannot be empty', function () {
                }, 'Error');
                return false;
            }
            event.preventDefault();
            $.mobile.changePage("#atx-form-page", { transition: "slide", changeHash: true });
            return false;
        });
    },



    initCategoryPage: function () {
        if (! Application.checkConnection())
            return;
        var $List = $('#category-list');
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_faqcategory/' + $lng ;
        var htmlItems = '';
        $List.empty();
        ajaxing = true;
        $.ajax({
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:5000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       console.log('Category:ajax Complete');
                       //if (fetchdata == false) return;                       
                   },

                   success: function (data, status) { 
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Topics category not available.', function () {
                           }, 'Error');
                           $.mobile.changePage("#home-page", { transition: "fade", changeHash: true });
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               htmlItems +='<li><a class="categotyItem" data-transition="slide"  tid=' + value.tid + ' tname=' + value.name + '  href="#faq-list-page">' + value.name + '</a></li>';
                           });
                       });
                       loadCategory = true;
                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                   },
                   error: function (e, textStatus) {
                       if (textStatus == 'timeout') {    
                           navigator.notification.alert('Unable to connect with server please try again later.', function () {
                           }, 'Error');        
                       }
                       console.log(e.message);
                   }
               });

        $(document).off("vclick", '.categotyItem').on("vclick", '.categotyItem', function(event) {
            event.preventDefault();
            var $tid = $(this).attr("tid") ;
            var $tname = $(this).attr("tname") ;
            $('.category-name').text($tname);
            //  $('.faq-detail-category').text($tname);
            category = $tname;
            Application.initFaqsListPage($tid);
        });
    },

    initFaqDetailPage: function ($nid) {
        if (! Application.checkConnection())
            return;
        // alert($nid);
        var $body = $('.node-body');
        var $title = $('.node-title');
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_showfaq/' + $nid;
        ajaxing = true;
        $.ajax({
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:5000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       if (fetchdata == false)
                           return;
                       //   $.mobile.changePage("#faq-detail-page" , { transition: "slide", changeHash: true });
                       $.mobile.changePage("faq-detail-page.html?nid=" + $nid, { transition: "slide", changeHash: true });
                                        
                       console.log('FaqDetail:ajax Complete');
                   },

                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert("Question's detail not available.", function () {
                           }, 'Error');
                        
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               $title.html(value.title);
                               $body.html(value.body);
                               return false;
                           });
                       });
                   },
            
                   error: function (e, textStatus) {
                       if (textStatus == 'timeout') {    
                           navigator.notification.alert('Unable to connect with server please try again later.', function () {
                           }, 'Error');        
                       }
                       console.log(e.message);
                   }
               });
    },

    initFaqsListPage: function ($tid) {
        if (! Application.checkConnection())
            return;
        var $List = $('.faqs-list');
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_faqlist/' + $tid + '/' + $lng ;
        var htmlItems = '';
        $List.empty();
        ajaxing = true;
        $.ajax({
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:5000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       if (fetchdata == false)
                           return;
                       $.mobile.changePage("#faq-list-page", { transition: "slide", changeHash: true });
                       console.log('FaqList:ajax Complete');
                   },

                   success: function (data, status) {
                       console.log(data);

                       if (data.length < 1 || data['rows'].length < 1) {
                           //$.mobile.changePage("#browsetopic-page", { transition: "fade", changeHash: true });
                           navigator.notification.alert('Unable to retrieve the Topic list.', function () {
                           }, 'Error');
                           
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               htmlItems +='<li><a data-ajax= "false"  nid="' + value.nid + '" class="nodeItem" data-transition="slide" href="#faq-detail-page"><h2>' + value.title + '</h2><p>' + value.Question + '</p></a></li>';
                               //htmlItems +='<li><a  nid="' + value.nid + '" class="nodeItemExt" data-transition="flip" href="faq-detail-page.html?nid=' + value.nid +  '"><h2>' + value.title + '</h2><p>' + value.Question + '</p></a></li>';                               
                           });
                       });

                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                   },
                   error: function (e, textStatus) {
                       if (textStatus == 'timeout') {    
                           navigator.notification.alert('Unable to connect with server please try again later.', function () {
                           }, 'Error');        
                       }
                       console.log(e.message);
                   }
               });

        $(document).off("vclick", '.nodeItem').on("vclick", '.nodeItem', function(event) {
            event.preventDefault();
            var $nid = $(this).attr("nid") ;
            Application.initFaqDetailPage($nid);
        });
    },

    initHomePage: function () {
        var $List = $('#home-faqlist');
        var $lng = $("#app-language").val();
        var $homelistlimit = 4;
        if ($(window).height() > 480) {
            $homelistlimit = 6;
        }
           
        var $url = $PSserver + 'services/atx_faqRnd/' + $lng;
        var htmlItems = '';
        ajaxing = true;
        $.ajax({
                   type: 'GET',
                   url: $url,
                   timeout:5000,
                   async:false,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                   },
                   complete: function () {
                       ajaxing = false;
                       $.mobile.loading('hide');
                       console.log('Home:Ajax Complete');
                   },
                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Unable to retrieve the FAQ.', function () {
                           }, 'Error');
                           return;
                       }
                       var counter = 0;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               if (counter == $homelistlimit)
                                   return false;
                               counter++;
                               htmlItems +='<li><a nid="' + value.nid + '" class="nodeHomeItem" data-transition="slide" href="#faq-detail-page"><h2>' + value.title + '</h2></a></li>';
                           });
                       });
                       $List.empty();
                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                   },
                   error: function (e) {
                       console.log(e.message);
                   }
               });

        $(document).on("click", '.nodeHomeItem', function(event) {
            event.preventDefault();
            var $nid = $(this).attr("nid")  ;
            var $title = $(this).text();
            $('#node-title').text($title);
            Application.initFaqDetailPage($nid);
        });
    },

    checkConnection: function () {
        if (isDevice === true) {
            if (navigator.connection.type === Connection.NONE) {
                navigator.notification.alert('Please check your network connection', function () {
                }, 'Connection error');
                $.mobile.changePage("#home-page", { transition: "fade", changeHash: true });
                return false;
            }
        }
        return true;
    },

    loadCountry: function() {
        var country = {"AF" : "Afghanistan", "AL" : "Albania", "DZ" : "Algeria", "AS" : "American Samoa", "AD" : "Andorra", "AO" : "Angola", "AI" : "Anguilla", "AQ" : "Antarctica", "AG" : "Antigua and Barbuda", "AR" : "Argentina", "AM" : "Armenia", "AW" : "Aruba", "AU" : "Australia", "AT" : "Austria", "AZ" : "Azerbaijan", "BS" : "Bahamas", "BH" : "Bahrain", "BD" : "Bangladesh", "BB" : "Barbados", "BY" : "Belarus", "BE" : "Belgium", "BZ" : "Belize", "BJ" : "Benin", "BM" : "Bermuda", "BT" : "Bhutan", "BO" : "Bolivia", "BA" : "Bosnia and Herzegovina", "BW" : "Botswana", "BV" : "Bouvet Island", "BR" : "Brazil", "IO" : "British Indian Ocean Territory", "BN" : "Brunei Darussalam", "BG" : "Bulgaria", "BF" : "Burkina Faso", "BI" : "Burundi", "KH" : "Cambodia", "CM" : "Cameroon", "CA" : "Canada", "CV" : "Cape Verde", "KY" : "Cayman Islands", "CF" : "Central African Republic", "TD" : "Chad", "CL" : "Chile", "CN" : "China", "CX" : "Christmas Island", "CC" : "Cocos (Keeling) Islands", "CO" : "Colombia", "KM" : "Comoros", "CG" : "Congo", "CD" : "Congo, the Democratic Republic of the", "CK" : "Cook Islands", "CR" : "Costa Rica", "CI" : "Cote D'Ivoire", "HR" : "Croatia", "CU" : "Cuba", "CY" : "Cyprus", "CZ" : "Czech Republic", "DK" : "Denmark", "DJ" : "Djibouti", "DM" : "Dominica", "DO" : "Dominican Republic", "EC" : "Ecuador", "EG" : "Egypt", "SV" : "El Salvador", "GQ" : "Equatorial Guinea", "ER" : "Eritrea", "EE" : "Estonia", "ET" : "Ethiopia", "FK" : "Falkland Islands (Malvinas)", "FO" : "Faroe Islands", "FJ" : "Fiji", "FI" : "Finland", "FR" : "France", "GF" : "French Guiana", "PF" : "French Polynesia", "TF" : "French Southern Territories", "GA" : "Gabon", "GM" : "Gambia", "GE" : "Georgia", "DE" : "Germany", "GH" : "Ghana", "GI" : "Gibraltar", "GR" : "Greece", "GL" : "Greenland", "GD" : "Grenada", "GP" : "Guadeloupe", "GU" : "Guam", "GT" : "Guatemala", "GN" : "Guinea", "GW" : "Guinea-Bissau", "GY" : "Guyana", "HT" : "Haiti", "HM" : "Heard Island and Mcdonald Islands", "VA" : "Holy See (Vatican City State)", "HN" : "Honduras", "HK" : "Hong Kong", "HU" : "Hungary", "IS" : "Iceland", "IN" : "India", "ID" : "Indonesia", "IR" : "Iran, Islamic Republic of", "IQ" : "Iraq", "IE" : "Ireland", "IL" : "Israel", "IT" : "Italy", "JM" : "Jamaica", "JP" : "Japan", "JO" : "Jordan", "KZ" : "Kazakhstan", "KE" : "Kenya", "KI" : "Kiribati", "KP" : "Korea, Democratic People's Republic of", "KR" : "Korea, Republic of", "KW" : "Kuwait", "KG" : "Kyrgyzstan", "LA" : "Lao People's Democratic Republic", "LV" : "Latvia", "LB" : "Lebanon", "LS" : "Lesotho", "LR" : "Liberia", "LY" : "Libyan Arab Jamahiriya", "LI" : "Liechtenstein", "LT" : "Lithuania", "LU" : "Luxembourg", "MO" : "Macao", "MK" : "Macedonia, the Former Yugoslav Republic of", "MG" : "Madagascar", "MW" : "Malawi", "MY" : "Malaysia", "MV" : "Maldives", "ML" : "Mali", "MT" : "Malta", "MH" : "Marshall Islands", "MQ" : "Martinique", "MR" : "Mauritania", "MU" : "Mauritius", "YT" : "Mayotte", "MX" : "Mexico", "FM" : "Micronesia, Federated States of", "MD" : "Moldova, Republic of", "MC" : "Monaco", "MN" : "Mongolia", "MS" : "Montserrat", "MA" : "Morocco", "MZ" : "Mozambique", "MM" : "Myanmar", "NA" : "Namibia", "NR" : "Nauru", "NP" : "Nepal", "NL" : "Netherlands", "AN" : "Netherlands Antilles", "NC" : "New Caledonia", "NZ" : "New Zealand", "NI" : "Nicaragua", "NE" : "Niger", "NG" : "Nigeria", "NU" : "Niue", "NF" : "Norfolk Island", "MP" : "Northern Mariana Islands", "NO" : "Norway", "OM" : "Oman", "PK" : "Pakistan", "PW" : "Palau", "PS" : "Palestinian Territory, Occupied", "PA" : "Panama", "PG" : "Papua New Guinea", "PY" : "Paraguay", "PE" : "Peru", "PH" : "Philippines", "PN" : "Pitcairn", "PL" : "Poland", "PT" : "Portugal", "PR" : "Puerto Rico", "QA" : "Qatar", "RE" : "Reunion", "RO" : "Romania", "RU" : "Russian Federation", "RW" : "Rwanda", "SH" : "Saint Helena", "KN" : "Saint Kitts and Nevis", "LC" : "Saint Lucia", "PM" : "Saint Pierre and Miquelon", "VC" : "Saint Vincent and the Grenadines", "WS" : "Samoa", "SM" : "San Marino", "ST" : "Sao Tome and Principe", "SA" : "Saudi Arabia", "SN" : "Senegal", "CS" : "Serbia and Montenegro", "SC" : "Seychelles", "SL" : "Sierra Leone", "SG" : "Singapore", "SK" : "Slovakia", "SI" : "Slovenia", "SB" : "Solomon Islands", "SO" : "Somalia", "ZA" : "South Africa", "GS" : "South Georgia and the South Sandwich Islands", "ES" : "Spain", "LK" : "Sri Lanka", "SD" : "Sudan", "SR" : "Suriname", "SJ" : "Svalbard and Jan Mayen", "SZ" : "Swaziland", "SE" : "Sweden", "CH" : "Switzerland", "SY" : "Syrian Arab Republic", "TW" : "Taiwan, Province of China", "TJ" : "Tajikistan", "TZ" : "Tanzania, United Republic of", "TH" : "Thailand", "TL" : "Timor-Leste", "TG" : "Togo", "TK" : "Tokelau", "TO" : "Tonga", "TT" : "Trinidad and Tobago", "TN" : "Tunisia", "TR" : "Turkey", "TM" : "Turkmenistan", "TC" : "Turks and Caicos Islands", "TV" : "Tuvalu", "UG" : "Uganda", "UA" : "Ukraine", "AE" : "United Arab Emirates", "GB" : "United Kingdom", "US" : "United States", "UM" : "United States Minor Outlying Islands", "UY" : "Uruguay", "UZ" : "Uzbekistan", "VU" : "Vanuatu", "VE" : "Venezuela", "VN" : "Viet Nam", "VG" : "Virgin Islands, British", "VI" : "Virgin Islands, U.s.", "WF" : "Wallis and Futuna", "EH" : "Western Sahara", "YE" : "Yemen", "ZM" : "Zambia", "ZW" : "Zimbabwe" };
        var str = '';
        for (var c in country) {
            str += '<option value="' + c + '">' + country[c] + '</option>';
        }
        $("#atx-country").append(str);
    },

    loadAge: function() {
        var str = '';
        for (var counter = 4; counter < 60; counter++) {
            str += '<option value="' + counter + '">' + counter + '</option>';
        }
        $("#atx-age").append(str);
    },

    _setDbValues: function() {
        var data = { };
        data['name'] = $('#atx-name').val().trim();
        data['email'] = $('#atx-email').val().trim();
        data['age'] = $('#atx-age').val().trim();
        data['country'] = $('#atx-country').val().trim();
      
        data['is_teacher'] = $('input[name=atx-is_teacher]:checked', '#atx-form').val()
        //  data['is_teacher'] = ($("#atx-is_teacher").is(':checked'))?1:0;

        localStorage.setItem('userProfile', JSON.stringify(data));

        data['question'] = $('#atx-question').val().trim();
        data['category'] = $('#atx-question-category').val().trim();
        if (isDevice == true) {
            if (data['name'] === '') {
                navigator.notification.alert('Name field is required and cannot be empty', function () {
                }, 'Error');
                return false;
            }
            if (data['age'] === '') {
                navigator.notification.alert('Invalid Age, Please select your age', function () {
                }, 'Error');
                return false;
            }            
            if (data['email'] === '') {
                navigator.notification.alert('Email field is required and cannot be empty', function () {
                }, 'Error');
                return false;
            }
            if (!Application.validateEmail(data['email'])) {
                navigator.notification.alert('Invalid email address', function () {
                }, 'Error');
                return false;
            }
            if (data['country'] === '') {
                navigator.notification.alert('Invalid Country, Please select your country', function () {
                }, 'Error');
                return false;
            }
            if (data['question'] === '') {
                navigator.notification.alert('Question is required and cannot be empty', function () {
                }, 'Error');
                return false;
            } 
            if (data['category'] === '') {
                navigator.notification.alert('Invalid Category, Please select question category', function () {
                }, 'Error');
                return false;
            }

            data['deviceModel'] = device.model ;
            data['deviceUuid'] = device.uuid;
            data['devicePlatform'] = device.platform;
            data['deviceVersion'] = device.version;
        } else {
            if (data['name'] === '') {
                alert('Name field is required and cannot be empty');
                return false;
            }
            if (data['country'] === '') {
                alert('Invalid Country, Please select your country');
                return false;
            }            
            if (data['email'] === '') {
                alert('Email field is required and cannot be empty');
                return false;
            }
            if (!Application.validateEmail(data['email'])) {
                alert('Invalid email address');
                return false;
            }

            if (data['age'] === '') {
                alert('Invalid Age, Please select your age');
                return false;
            }

            data['deviceModel'] = 'n/d';
            data['deviceUuid'] = 'n/d';
            data['devicePlatform'] = 'browser';
            data['deviceVersion'] = 'n/d';
        }
        return data;
    },

    _getDbValues: function() {
        if (localStorage.getItem('userProfile') != undefined) {
            var data = localStorage.getItem('userProfile');
            var items = JSON.parse(data)  ;

            if (items.name != undefined) {
                $("#atx-name").val(items.name);
            }
            if (items.email != undefined) {
                result = document.getElementById("atx-email");
                result.value = items.email;
            }
            if (items.age != undefined) {
                $('#atx-age').val(items.age).selectmenu("refresh");
                /*
                result = document.getElementById("atx-age");
                alert( items.age);
                result.value = items.age;
                $('#atx-age').selectmenu("refresh");
                */
            }
            if (items.country != undefined) {
                $('#atx-country').val(items.country).selectmenu("refresh");
                /*
                result = document.getElementById("atx-country");
                result.value = items.country;
                $('#atx-country').selectmenu("refresh");
                */
            }
            if (items.is_teacher != undefined) {
                $("input[name=atx-is_teacher][value=" + items.is_teacher + "]").prop('checked', true).refresh;
                //   $('#atx-is_teacher').prop('checked', items.is_teacher);
            }
        }
    } ,


    /*
    updateLogo: function () {
    var isMobileWidth = ($(window).width() <= 480);
    if  (isMobileWidth)
    {
    $('.homelogo img').attr('src','images/logo.png')  ;
    $('.logo img').attr('src','images/logo.png')  ;
    }
    else
    {
    $('.homelogo img').attr('src','images/header1024.png')  ;
    $('.logo img').attr('src','images/header1024.png')  ;
    }
    },
    updateIcons: function () {
    var $buttons = $('a[data-icon], button[data-icon]');
    var isMobileWidth = ($(window).width() <= 480);
    if (isMobileWidth) {
    $('.hdr-bk-btn a[data-icon], button[data-icon]').attr('data-iconpos', 'notext');
    }
    else {
    $('.hdr-bk-btn a[data-icon], button[data-icon]').attr('data-iconpos');
    }
    },   */
    validateEmail: function (email) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

        if (reg.test(email) == false) {
            return false;
        }
 
        return true;
    } ,

};

// create seasons array and and repeat ajax call until all results are returned
function callback(result) {
    //	console.log(result);
}