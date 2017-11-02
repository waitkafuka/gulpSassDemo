var bannerHandle;
var recommendHandle;
var labelHandle;
var areaListHandle;
var areaItemListHandle;
var smallImgHandle;
var limit_time_Handle;
var limit_num_Handle;
var countID = [];
//贵州用户隐藏功能机专区
var phoneSectionData;
//是否有抢购商品
var hasLimitProd;
var IMG_TYPE = {
    S: 'image100x180',
    M: 'image150x270',
    L: 'image300x540'
};
var productId;
var clickSource; //点击源，可能是颜色、内存或者版本
var currentUnit; //当前选中商品单元
var limitHandle;
var hasInited;
var optionHtml
var mcdsUnitSubclsTypeCd; //商品细分类别
var suplerId; //供应商ID
$(document).ready(function() {
    var searchInput = $("#J_search_input");
    var clearSearch = $("#J_clear_search");
    optionHtml = $('#color-nc-box').html();//手机选项，配件并不需要
    searchInput.unbind(); //移除public.js中绑定事件
    //搜索框获得焦点或是键盘按下时
    searchInput.on('focus keyup', function() {
        if (searchInput.val() !== '') {
            clearSearch.show();
            //筛选二字变为取消二字
            $("a.off-search").text("取消");
        } else {
            clearSearch.hide();
            //筛选二字变为取消二字
            $("a.off-search").text("筛选");
        }
        clearSearch.click(function() {
            searchInput.val('');
            $("a.off-search").text("筛选");
            $(this).hide();
        });
    });

    smallImgHandle = Handlebars.compile($("#pro-img-box-list-tpl").html());

    //判断类型,春节临时用标题图标
    Handlebars.registerHelper('checkType', function(str) {
        if (str == '爆款专区') {
            return '<div class="m-title clearfix">';
        } else {
            return '<div class="m-title m-titles clearfix">';
        }
    });
	
	Handlebars.registerHelper('limitCompare',function(v1,v2,options){
		if(v1 == v2){
			return options.fn(this);
		}else{
			return options.inverse(this);
		}
	});
	
    Handlebars.registerHelper('numshowcompare',function(v1,v2,options){
		if(v1 >= v2){
			return options.fn(this);
		}else{
			return options.inverse(this);
		}
	});

    //轮播图
    bannerHandle = Handlebars.compile($("#swiper-wrapper").html());
    //推荐
    recommendHandle = Handlebars.compile($("#hot-porduct-wrap").html());
    //标签
    labelHandle = Handlebars.compile($("#g-container-full").html());
    //专区列表
    areaListHandle = Handlebars.compile($("#J_area_list_tpl").html());
    //专区内容
    areaItemListHandle = Handlebars.compile($("#J_area_item_list_tpl").html());
    //限购
    limitHandle = Handlebars.compile($("#J_limit_form_tpl").html());

	//限时抢购
	limit_time_Handle = Handlebars.compile($("#J_limit_t_area_item_list_tpl").html());
	
	//限量秒杀
	limit_num_Handle = Handlebars.compile($("#J_limit_n_area_item_list_tpl").html());
	
    //轮播图
    srvMap.add($.CONSTANT.API.INDEX_BANNER, "../../assets/data/banner.json", "front/sh/prod!queryAutoShowPic?uid=p002");
    //推荐
    srvMap.add($.CONSTANT.API.INDEX_RECOMMEND, "../../assets/data/recommend.json", "front/sh/prod!queryCommendProd?uid=p001");
    //标签
    srvMap.add($.CONSTANT.API.INDEX_LABEL, "../../assets/data/label.json", "front/sh/prod!queryLblProd?uid=p003");
    //专区内容
    srvMap.add($.CONSTANT.API.INDEX_AREA, "../../assets/data/category-list.json", "front/sh/prod!queryAreaProdListByAreaCd?uid=p005&START=0&LIMIT=10");
    //商品详情
    srvMap.add($.CONSTANT.API.UNIT_LIST, "../../assets/data/bespeak/prod-detail.json", "front/sh/prod!queryMcdsUnitListByMcdsId?uid=p007");
    //配件详情
    srvMap.add("partsDetails", "", "front/sh/prod!queryphonePartsDetailForWSC?uid=p011");
	
	//限购产品详情
	srvMap.add($.CONSTANT.API.LIMIT_AREA,"","front/sh/limitBuy!getLimitProdInfo?uid=l001");
	
	//校验是否具有抢购权限
	srvMap.add("validatelimitBuy","","front/sh/limitBuy!validatePanicBuy?uid=l002");

    //轮播图
    Util.ajax.postJson($.CONSTANT.API.INDEX_BANNER, "", bannerCallback);
    //推荐
    Util.ajax.postJson($.CONSTANT.API.INDEX_RECOMMEND, "", recommendCallback);
    //标签
    Util.ajax.postJson($.CONSTANT.API.INDEX_LABEL, "", labelCallback);

    //获取贵州手机号json
    Util.ajax.postJsonSync("/data/phone-num-location.json", "", function(data) {
        if (data) {
            phoneSectionData = data;
        };
    });

    setTimeout(function() {
        //获取专区列表内容 fixme 延迟加载 原来页面800ms
        var areaList = $.CONSTANT.INDEX_AREA.list;

        //功能机专区排在最下面
        $(areaList).each(function(i){
            if(this.name == '功能机专区'){
                var temp = this;
                areaList = Util.Arrays.removeByIndex(areaList,i);
                areaList.push(this);
            }
        });

        //贵州用户移除功能机专区
        var loginId = getUserLoginId();
        if (loginId) {
            var phoneNumSection = loginId.substr(0, 7);
            if (phoneSectionData[phoneNumSection]) {
                //拿到数据为贵州用户
                $(areaList).each(function(i) {
                    if (this.name == '功能机专区') {
                        areaList = Util.Arrays.removeByIndex(areaList, i);
                    }
                });
            }
        };

		//去掉专区列表中限时专区和限购专区
		$(areaList).each(function(i){
		   if(this.id == 'fee34882-f99d-4a9e-bb23-0e956b984140' || 
		      this.id == '514d959d-cce1-4248-a034-e80dddbf5023'){
			       areaList = Util.Arrays.removeByIndex(areaList,i);
		   }
		});
		
        $('#J_area_list').html(areaListHandle(areaList));

        //请求每个专区的内容
        $(areaList).each(function(i, area) {
            var param = {
                SUIT_BIZ_NM: area.id
            };
            Util.ajax.postJson($.CONSTANT.API.INDEX_AREA, param, function(data, flag) {
                if (flag) {
                    data.beans = data.beans.splice(0, 4); //获取前4个商品
                    //显示库存，返回数据为100.0，截取为整数，价格每三位以逗号分割
                    $(data.beans).each(function(i) {
                        if(typeof this.SKU_QTY != 'undefined'){
                            this.SKU_QTY = this.SKU_QTY.split(".")[0];
                            this.UPRC = formatNum(this.UPRC);
                        }
                    });
                    var html = areaItemListHandle(data);
                    $('#J_area_item_list_' + area.id).html(html);
                    //获取数据后显示专区
                    $('#J_area_' + area.id).show();
                    //配件专区特殊处理
                    if(area.name == '配件专区'){
                        //配件专区跳转配件专区列表页
                        $('#J_area_'+area.id+' div:first a').attr('onclick','gotoPartArea("area","'+area.name+'","'+area.id+'")');
                        //配件专区更换点击事件
                        $('.product_list_new ul[titleName=配件专区] .buy_btn').each(function(index,item){
                            var tmp = $(item).attr('onclick');
                            $(item).attr('onclick',tmp.replace('openBuyDialog','openBuyPartDialog'));
                        });
                    }
                }
            });
        });
		
		
		//查询限时购买产品并将产品放入限购专区
		var limit_t_param = {
                "areaId" : "fee34882-f99d-4a9e-bb23-0e956b984140",
				"pmtTypeCd" : "05",
				"start" : "0",
				"limit" : "5"
        };
		Util.ajax.postJsonSync($.CONSTANT.API.LIMIT_AREA, limit_t_param, function(data) {//获取限时购买产品数据
		    if(data.bean.total > 0){//返回成功
			    data.beans = data.beans.splice(0, 2); //获取前4个商品
				var limit_t_html = limit_time_Handle(data); 
				$("#J_limit_t_area_item_list").html(limit_t_html);
				hasLimitProd = true;
				$.each(data.beans,function(i){
					var showStyle = this.panicBuyState == "抢购中" ? "end":"before";
					var seconds;
					if(showStyle == "before"){
						seconds = this.beforeStartTime;
					}else{
						seconds = this.beforeEndTime; 
					}
					var pid = this.mcdsId;
					//console.log(pid);
					countID[countID.length] = pid + "_" + seconds;
					new Timer(seconds,pid);
				});
			}else{
				hasLimitProd = false;
			}
		});
		
		//查询限量购买产品并将产品放入限购专区 
		var limit_n_param = {
                "areaId" : "514d959d-cce1-4248-a034-e80dddbf5023",
				"pmtTypeCd" : "06",
				"start" : "0",
				"limit" : "5"
        };
		Util.ajax.postJsonSync($.CONSTANT.API.LIMIT_AREA, limit_n_param, function(data) {//获取限量购买产品数据
		    if(data.bean.total > 0){//返回成功
			    data.beans = data.beans.splice(0, 2); //获取前4个商品
			    
				var limit_n_html = limit_num_Handle(data); 
				$("#J_limit_t_area_item_list").append(limit_n_html);
				$.each(data.beans,function(i){
					var showStyle = this.panicBuyState == "抢购中" ? "end":"before";
					var seconds;
					if(showStyle == "before"){
						seconds = this.beforeStartTime;
						var pid = this.mcdsId;
					    countID[countID.length] = pid + "_" + seconds;
						new Timer(seconds,pid);
					}
				});
			}else{
				if(!hasLimitProd)
					$("#J_limit_area").hide();
					//$("#J_limit_t_area_item_list").html('<li style="text-align: center;font-size: 0.95rem;">暂无活动商品</li>');
			}
		});
		
    }, 500);

    //搜索框获得焦点或是键盘按下时
    //    $('#J_search_input').on('focus keyup', function() {
    //
    //        if ($(this).val() !== '') {
    //            $('#J_search_btn').hide();
    //            $("#J_search_cancel").show();
    //        }
    //    });
    $("#J_search_cancel").click(function() {
        $('#J_search_btn').show();
        $("#J_search_cancel").hide();
        $('#J_search_input').blur();
    })

    var notFirst = $.MALL_STORAGE.tmpGet('notFirst');
    if (!notFirst) {
        $.MALL_STORAGE.tmpSave('notFirst', true);
    }

    $("body").delegate(".ui-cover", "click", function() {
        $("#J_dialog_close").click();
    });
});

/**
*计时器类
*@param maxtime 距离结束或开始时间的秒数
*@param id  计时器元素id后缀
*/
function Timer(maxtime,id){
//maxtime：时间，单位s
//id：显示计时器信息的容器id
//callback：计时器结束回调
    var tmp;
    function CountDown() {
        if (maxtime >= 0) {
			
            hours = Math.floor(maxtime / (60 * 60));
            tmp = maxtime - hours * 60 * 60 ;
            minutes = Math.floor(tmp / (60 ));
            tmp = tmp - minutes * 60;
            seconds = tmp;
            if(hours < 10){
				hours = "0" + hours;
			}
			if(minutes < 10){
				minutes = "0" + minutes; 
			}
			if(seconds < 10){
				seconds = "0" + seconds; 
			}
			var timeHtml = "<i>"+hours+"</i>:<i>"+minutes+"</i>:<i>"+seconds+"</i>";
			$("#time_"+id).html(timeHtml);
            //$("#hour_"+id).html(hours);
			//$("#minute_"+id).html(minutes);
			//$("#second_"+id).html(seconds);
            maxtime -= 1;
        }
        else {
            clearInterval(timer);
            //if(typeof callback=="function")callback();//执行倒计时完成后的回调
        }
    }
    var timer = setInterval(function(){CountDown()}, 1000);
}

/**
*校验是否具有抢购权限
*@param pid  商品id
*@param areaid  专区id
*@pmtType 抢购类型
*/
function validatePanicBuy(pid,pmtType){
	var validate_param = {
		        "mcdsId" : pid,
				"pmtTypeCd" : pmtType
    };
	Util.ajax.postJson(srvMap.get("validatelimitBuy"),validate_param,function(data){
		if(data.bean != null && data.bean.validFlag){
			window.location.href = '../commodity-details/commodity-details.html?productId=' + pid;
		}else{
			Util.Tips.warning("手慢了，已不能购买，下次再来吧~", 'bottom', true);
		}
	});
}

function openBuyDialog(prodId) {
	/**
	console.log($(this.hasClass("bt_disable"));
	if($(this).hasClass("bt_disable")){
		return false;
	}*/
	
    var param = {
        MCDS_UNIT_ID: prodId,
		
    }
    productId = prodId;
    Util.ajax.postJson($.CONSTANT.API.UNIT_LIST, param, function(data, flag) {
        $('#color-nc-box').html(optionHtml);
        buildGroup(data, flag);
    });
}

function openBuyPartDialog(prodId){
    productId = prodId;
    Util.ajax.postJson('partsDetails', {mcdsUnitId:prodId}, function(data, flag) {
        $('#color-nc-box').html('');
        buildPartsGroup(data, flag);
    });
}

function buildGroup(data, flag) {
    //if (flag) {
    gs = data.object;
    mcdsUnitSubclsTypeCd = gs[0].mcdsUnitSubclsTypeCd;
    if (gs.length && gs.length > 0) { //当有商品数据

        //打乱gs的排序，把有货的拍前面，无货的拍后面，但并不是严格的降序
        var gsTemp;
        for (var i = 0; i < gs.length; i++) {
            for (var j = i; j < gs.length; j++) {
                if (gs[i].SKU_QTY < gs[j].SKU_QTY) {
                    gsTemp = gs[i];
                    gs[i] = gs[j];
                    gs[j] = gsTemp;
                }
            }
        };

        //默认显示第一个商品信息
        // !!! 最后默认点击第一个可点击的商品，可能不是同一个商品
        bindUnitItem(gs[0]);


        //初始化详情，参数，售后tab的滚动、点击效果和位置
        //initTab();
        initPopMenu();

        var colors = []; // 颜色集合
        var ncs = []; // 内存集合
        var version = []; // 网络格式集合
        var prices = []; // 价格集合
        var goodsLeft = []; // 库存集合
        var limit_buy = []; // 限购集合
        $(gs).each(function(index, e) {
            colors.push(e.COLOR);
            ncs.push(e.MEMORY);
            ncs.push(e.MEMORY);
            version.push(e.VERSION);
            goodsLeft.push(e.SKU_QTY);
            limit_buy.push(e.BUY_LIMIT_NUM);
            prices.push(e.UPRC);
        });

        var minPrice = prices.min();
        var maxPrice = prices.max();

        if (minPrice == maxPrice) {
            price_min_max = minPrice;
        } else {
            price_min_max = minPrice + '~' + maxPrice;
        }

        productImage = gs[0].image[0][IMG_TYPE.M];

        productName = gs[0].MCDS_UNIT_NM;

        //添加浏览记录
        $.MALL_STORAGE.productBrowse(productId, productName, productImage, price_min_max);

        colors = colors.hashset(); // 去重
        ncs = ncs.hashset();
        version = version.hashset();
        // 渲染html页面
        var htmlTemp = "";
        for (var i = 0; i < colors.length; i++) {
            htmlTemp += "<span type='color' con='" + colors[i] + "'>" + colors[i] + "</span> ";
        }
        $("#J_sl_color").html(htmlTemp);
        htmlTemp = "";
        for (var i = 0; i < ncs.length; i++) {
            htmlTemp += "<span type='nc' con='" + ncs[i] + "'>" + ncs[i] + "</span> ";
        }
        $("#J_sl_nc").html(htmlTemp);

        htmlTemp = "";
        for (var i = 0; i < version.length; i++) {
            htmlTemp += "<span type='v' con='" + version[i] + "'>" + version[i] + "</span> ";
        }
        $("#J_sl_vers").html(htmlTemp);
        change();
        //}
        // 商品参数规格选择
        var tab_item = $("#J_sl_color span,#J_sl_nc span,#J_sl_vers span"); // 获取tab下面的项目元素
        tab_item.click(function() {

            // 不可点击的直接返回
            if ($(this).hasClass('disabled')) {
                return false;
            }
            // 点击后样式处理
            if ($(this).hasClass('current')) {
                // 看有几个兄弟元素，如果没有，不能取消选中样式
                var l = $(this).siblings().length;
                if (l > 0) {
                    $(this).removeClass('current');
                }
            } else {
                $(this).addClass('current').siblings().removeClass('current');
                clickSource = $(this);
            }

            // 根据点击选择的参数，改变可点选项
            change();
        });

        //立即购买
        $("#J_buy_now_btn").click(function() {
            var isLoginCallback = function() {
                if (!currentUnit) {
                    Util.Tips.warning("请选择商品规格", 'bottom', true);
                    return false;
                } else {
                    if (currentUnit.SKU_QTY == '0') {
                        Util.Tips.warning("商品库存不足", 'bottom', true);
                    } else {
                        //规格参数
                        var typeId = currentUnit.MCDS_UNIT_ID;
                        //选择数量
                        var goodsNum = $('#J_num_val').val() || 1;;
                        if (parseInt(goodsNum) > parseInt(currentUnit.SKU_QTY)) {
                            Util.Tips.warning("超出数量范围~", 'bottom', true);
                            return;
                        }
                        if (!currentUnit.multiple && goodsNum != '1') {
                            Util.Tips.warning("当前商品仅支持同时购买1件", 'bottom', true);
                            return;
                        }
                        //限制某些商品每月最多购买两件
                        if (!limitBuyRole01(productId, null, goodsNum)) {
                            return false;
                        };
                        window.location.href = '../order-confirm/order-confirm.html?source=1&productId=' + productId + '&typeId=' + typeId + '&goodsNum=' + goodsNum;
                    }

                }
            };

            TestUserLogin(isLoginCallback, notLoginCallback);

        });

        //添加购物车按钮
        $("#J_add_shop_btn").click(function() {
            var isLoginCallback = function() {

                if (!currentUnit) {
                    Util.Tips.warning("请选择商品规格", 'bottom', true);
                    return false;
                } else {
                    if (currentUnit.SKU_QTY == '0') {
                        Util.Tips.warning("商品库存不足", 'bottom', true);
                    } else {

                        var goodsNum = $('#J_num_val').val() || 1;

                        if (parseInt(goodsNum) > parseInt(currentUnit.SKU_QTY)) {
                            Util.Tips.warning("超出数量范围~", 'bottom', true);
                            return;
                        }

                        if (!currentUnit.multiple && goodsNum != '1') {
                            Util.Tips.warning("当前商品仅支持同时购买1件", 'bottom', true);
                            return;
                        }

                        //限制某些商品每月最多购买两件
                        if (!limitBuyRole01(productId, null, goodsNum)) {
                            return false;
                        };

                        var param = {
                            mcdsId: productId,
                            mcdsCatgParaId: currentUnit.MCDS_UNIT_ID,
                            mcds_Qty: goodsNum,
                            pmtId: currentUnit.PMT_ID,
                            coopPrnrId: currentUnit.PTY_ID,
                            mcdsUnitSubclsTypeCd: mcdsUnitSubclsTypeCd //商品细分类别
                        };
                        srvMap.add("cart-add-api", "", "front/sh/shopCart!saveShopCart?uid=sc001&custId=8888");
                        Util.ajax.postJson(srvMap.get("cart-add-api"), param, function(data, flag) {
                            if (data.bean && data.bean.addResult) {
                                var result = data.bean.addResult;
                                if ('0' == result) {
                                    Util.Tips.success("商品已添加至购物车", 'bottom', true);
                                } else if ('9999' == result) {
                                    Util.Tips.warning("添加失败", 'bottom', true);
                                } else if ('3' == result) {
                                    Util.Tips.warning("商品已添加至购物车，请勿重复添加", 'bottom', true);
                                } else if ('2' == result) {
                                    Util.Tips.warning("商品库存不足", 'bottom', true);
                                } else if ('1' == result) {
                                    Util.Tips.warning("商品不存在", 'bottom', true);
                                } else {
                                    Util.Tips.warning("添加失败", 'bottom', true);
                                }
                            } else {
                                Util.Tips.warning("添加失败", 'bottom', true);
                            }

                        });
                    }

                }
            };

            TestUserLogin(isLoginCallback, notLoginCallback);

        });


        //加载完成之后默认选中第一个可点的属性
        $('#J_sl_color span:first').click();
        $('#J_sl_nc span:not(.disabled):first').click();
        $('#J_sl_vers span:not(.disabled):first').click();
        //如果选中之后库存为0，还要继续选，直到选中一个有货的产品为止
        var colorButtons = $('#J_sl_color span');
        var ncButtons = $('#J_sl_nc span');
        var versButtons = $('#J_sl_vers span');
        if (currentStock < 1) {
            //先点击一遍颜色按钮
            for (var i = 0; i < colorButtons.length; i++) {
                $('#J_sl_color span:eq(' + i + ')').click();
                if (currentStock > 0) {
                    return;
                }
            }
            //如果都没有货，还是选中第一个比较好看
            $('#J_sl_color span:first').click();
            //如果还没货，点击内存
            for (var i = 0; i < colorButtons.length; i++) {
                $('#J_sl_nc span:eq(' + i + ')').click();
                if (currentStock > 0) {
                    return;
                }
            }
            $('#J_sl_nc span:first').click();
            //如果还没货，点击版本
            for (var i = 0; i < colorButtons.length; i++) {
                $('#J_sl_vers span:eq(' + i + ')').click();
                if (currentStock > 0) {
                    return;
                }
            }
            $('#J_sl_vers span:first').click();
        }
        //三体运动实在是太难计算了，三参数之间的交互规则很难指定。下面这段奇葩的代码是为了解决一个棘手的问题：初始状态下某些本来应该可点的参数却是不可点击的。下面这段代码是没有问题的，而且很重要
        $('#J_sl_color span:not(.disabled):first').click();
        $('#J_sl_nc span:not(.disabled):first').click();
        $('#J_sl_vers span:not(.disabled):first').click();
        $('#J_sl_color span:not(.disabled):first').click();
        $('#J_sl_nc span:not(.disabled):first').click();
        $('#J_sl_vers span:not(.disabled):first').click();

    }

}

/**
 * 改变没有对应规格的状态
 */
function change() {
    var color = $('span[type=color].current');
    var nc = $('span[type=nc].current');
    var version = $('span[type=v].current');
    color = color.length ? color.attr('con') : null;
    nc = nc.length ? nc.attr('con') : null;
    version = version.length ? version.attr('con') : null;
    changeState(color, nc, version);
}


function changeState(color, memory, version) {

    var tip = '';
    if (color || memory || version) {
        tip = '已选择 '
    }
    if (color) {
        tip += color + ' ';
    }
    if (memory) {
        tip += memory + ' ';
    }
    if (version) {
        tip += version + ' ';
    }

    if (!(color && memory && version)) {
        $('#J_num_val').val(1)
        tip += '<br>请选择 ';
    }
    if (!color) {
        tip += '颜色 ';
    }
    if (!memory) {
        tip += '内存 ';
    }
    if (!version) {
        tip += '版本 ';
    }

    $('#J_select_tip').html(tip);

    //符合选中条件的商品列表
    var list = [];

    if (color && !memory && !version) {
        $(gs).each(function(index, e) {
            if (e.COLOR == color) {
                list.push(e);
            }
        });
    }
    if (!color && memory && !version) {
        $(gs).each(function(index, e) {
            if (e.MEMORY == memory) {
                list.push(e);
            }
        });
    }
    if (!color && !memory && version) {
        $(gs).each(function(index, e) {
            if (e.VERSION == version) {
                list.push(e);
            }
        });
    }
    if (color && memory && !version) {
        $(gs).each(function(index, e) {
            if (e.COLOR == color && e.MEMORY == memory) {
                list.push(e);
            }
        });
    }
    if (color && !memory && version) {
        $(gs).each(function(index, e) {
            if (e.COLOR == color && e.VERSION == version) {
                list.push(e);
            }
        });
    }
    if (!color && memory && version) {
        $(gs).each(function(index, e) {
            if (e.MEMORY == memory && e.VERSION == version) {
                list.push(e);
            }
        });
    }
    if (!color && !memory && !version) {
        list = gs;
    }
    if (color && memory && version) {
        $(gs).each(function(index, e) {
            if (e.MEMORY == memory && e.VERSION == version && e.COLOR == color) {
                list.push(e);
            }
        });
    }

    var memoryList = [],
        colorList = [],
        versionList = [],
        Price = [],
        stock = 0;


    $(list).each(function(i, item) {
        memoryList.push(item.MEMORY);
        colorList.push(item.COLOR);
        versionList.push(item.VERSION);
        Price.push(parseInt(item.UPRC));
        stock += parseInt(item.SKU_QTY);

    });
    //如果三个参数都确定的时候，库存不再为所有之和，而是确定的具体某种型号的库存
    if ((color && memory && version) || (!color && !memory && !version)) {
        $(list).each(function(i, item) {
            if (item.COLOR == color && item.MEMORY == memory && item.VERSION == version) {
                stock = parseInt(item.SKU_QTY);
                currentStock = stock;
                currentUnit = item;
            }
        });
    }

    var minPrice = Price.min();
    var maxPrice = Price.max();
    var priceStr;
    if (minPrice == maxPrice) {
        priceStr = maxPrice;
    } else {
        priceStr = minPrice + '~' + maxPrice;
    }
    $('.J_pro_price').text(priceStr);
    if (stock > 0) {
        $('.stock').html("剩余<span class='J_pro_num' id='J_pro_num'>" + stock + "</span>件");
        $('#J_num_val').val(1);
        $('#J_num_val').removeClass('disabled').removeAttr("disabled");
        $('#J_num_add').removeClass('disabled').removeAttr("disabled");
    } else {
        $('.stock').html("无货");
        $('#J_num_val').val(0);
        $('#J_num_val').attr({ disabled: 'true' }).addClass('disabled');
        $('#J_num_add').attr({ disabled: 'true' }).addClass('disabled');
    }
    memoryList = memoryList.hashset();
    colorList = colorList.hashset();
    versionList = versionList.hashset();

    var colorSpan = $('span[type=color]');
    var ncSpan = $('span[type=nc]');
    var versionSpan = $('span[type=v]');

    //如果当前点击的是颜色，不会改变颜色的disabled状态
    var clickSourceType = clickSource && clickSource.attr("type");
    if (clickSourceType && clickSourceType != 'color') {

        $(colorSpan).each(function(i, span) {
            if (colorList.contains($(span).attr('con'))) {
                $(span).removeClass('disabled');
            } else {
                $(span).addClass('disabled');
            }
        });
    }

    if (clickSourceType && clickSourceType != 'nc') {
        $(ncSpan).each(function(i, span) {
            if (memoryList.contains($(span).attr('con'))) {
                $(span).removeClass('disabled');
            } else {
                $(span).addClass('disabled');
            }
        });
    }

    if (clickSourceType && clickSourceType != 'v') {
        $(versionSpan).each(function(i, span) {
            if (versionList.contains($(span).attr('con'))) {
                $(span).removeClass('disabled');
            } else {
                $(span).addClass('disabled');
            }
        });
    }
    if (color && memory && version && list.length) {
        G_current_typeId = currentUnit.MCDS_UNIT_ID;
        bindUnitItem(currentUnit);
    } else {
        G_current_typeId = null;
        currentUnit = null;
    }
}

//绑定商品单元内容
function bindUnitItem(unitItem) {
    var typeId = unitItem.MCDS_UNIT_ID;

    var smallImg = $(unitItem.image).map(function() {
        return this[IMG_TYPE.S]
    })[0];

    $(".pro-img-box").html(smallImgHandle(smallImg));

    //限购展示，一个或多个
    $("#J_limit_form").html(limitHandle(unitItem));
    initChangeNum();
}

//初始化商品数量选择
function initChangeNum(flag) {

    //数量加减
    var reduce = $(".num-reduce"); //数量减
    var add = $(".num-add"); //数量加
    var num_val = $(".num-show"); //获取显示数量的元素
    //点击数量减按钮
    var maxNum = parseInt($("#J_pro_num").text()) || 0; //设置最大数量
    if (hasInited) {
        return;
    };
    reduce.click(function() {
        //数量依次减1
        $(this).siblings('.num-show').val(parseInt($(".num-show").val()) - 1);
        if (parseInt($(this).siblings('.num-show').val()) <= 1) {
            //如果数量小于1禁止点击数量减按钮，并把数量设为1
            $(this).siblings('.num-show').val(1);
            $(this).attr({
                disabled: 'true'
            }).addClass('disabled');

        }
        if (parseInt($(this).siblings('.num-show').val()) < maxNum) {
            // 如果数量小于最大数量，将数量加按钮设为可用
            add.removeClass('disabled').removeAttr("disabled");
        }
        return false;
    });
    //点击数量加按钮
    add.click(function() {
        var maxNum = parseInt($("#J_pro_num").text()) || 0;
        var currentNum = parseInt($(".num-show").val()) + 1;
        $(this).siblings('.num-show').val(currentNum); //数量依次加1
        if (!limitBuyRole01(productId, null, currentNum)) {
            addAction($(this), currentNum);
            return false;
        };
        //如果是限定商品只能买两个
        if (productId == $.CONSTANT.LIMIT_BUY_PRODUCT_ID) {
            var qty = $(this).siblings('.num-show').val();
            if (parseInt(qty) > 5) {
                Util.Tips.warning("该商品最多只能购买5件~", 'bottom', true);
                $(this).siblings('.num-show').val(5);
                $(this).addClass('disabled').attr('disabled', 'disabled');
                return;
            } else if (parseInt(qty) == 5) { //4-->5
                $(this).siblings('.num-show').val(5);
                $(this).addClass('disabled').attr('disabled', 'disabled');
            }
        }
        if (parseInt($(this).siblings('.num-show').val()) > maxNum) {
            //如果大于最大数量禁止点击数量加按钮，并把数量最大数量
            $(this).siblings('.num-show').val(maxNum);
            Util.Tips.warning("超出数量范围~", 'bottom', true);
            $(this).attr({
                disabled: 'true'
            }).addClass('disabled');
        } else if (parseInt($(this).siblings('.num-show').val()) <= maxNum && parseInt($(this).siblings('.num-show').val()) > 1) {
            // 如果小于最大数量，删除数量减按钮的禁用状态
            $(".num-reduce").removeClass('disabled').removeAttr("disabled");
        }
    });


    $('#J_num_val').on('keyup blur', function() {
        maxNum = parseInt($("#J_pro_num").text()) || 0
        var qty = $(this).val();
        var qty = parseInt(qty);
        //如果是限制购买两件的商品
        if (!limitBuyRole01(productId, null, qty)) {
            inputNumAction($(this));
            return false;
        };
        if (isNaN(qty)) {
            $(this).val('');
            $(this).focus();
        } else {
            $(this).val(qty);
            if (qty > maxNum) {
                Util.Tips.warning("超出数量范围~", 'bottom', true);
            }
            $(this).focus();
        }
    });
    hasInited = flag;
}

// 初始化弹出购买弹窗
function initPopMenu() {
    var shpping_btn = $("#J_add_shop_btn"); //加入购物车按钮
    var buy_btn = $("#J_buy_now_btn"); //立即购买按钮
    //弹出购买产品弹框
    $(".buy-dialog").slideDown(200);
    //body中追加遮盖层，默认是隐藏的
    $("body").append(ui_cover_bg);
    //给遮盖层添加事件，点击的时候关闭弹窗
    $(".ui-cover").click(function() {
        $("#J_dialog_close").click();
    });

    //设置遮盖层显示
    //点击弹框上的关闭按钮
    $("#J_dialog_close,.ui-cover").click(function() {
        //让弹出框隐藏
        $(".buy-dialog").slideUp(100);
        //从body中删除遮盖层
        $("body .ui-cover").remove();
        //关闭购买弹窗时取消绑定事件，防止点击按钮多次添加购物车
        shpping_btn.unbind();
        buy_btn.unbind();
    });
}

//当没有登陆时
function notLoginCallback() {
    var loginFunction = function() {
        sessionStorage.setItem("returnUrl", document.location.href);
        window.location.href = '../login.html';
    };
    var registerFunction = function() {
        window.location.href = '../login/register.html';
    };
    Util.Confirm.create(
        '尊敬的用户您好，欢迎来到10085微商城，请先登录或注册。', ['登录', '注册'], [loginFunction, registerFunction]
    );
};

function labelCallback(data, flag) {
    //if(flag){
    data.beans = data.beans.splice(0, 3);
    var htmlmo = labelHandle(data);
    $("#full-mtb").html(htmlmo);
    //}
}

function recommendCallback(data, flag) {
    //if(flag){
    var porduct = recommendHandle(data.beans);
    $("#hot-porduct").html(porduct);
    //}
}

function bannerCallback(data, flag) {
    //if(flag){
    var porductff = bannerHandle(data);
    $("#banner").html(porductff);
    var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationClickable: false,
        autoplayDisableOnInteraction: false,
        spaceBetween: 0,
        autoplay: 2500,
        centeredSlides: true,
        loop: true,
        lazyLoading: true,
        lazyLoadingInPrevNext: true,
    });
    //}
}

//首页商品搜索
function globalsearch() {
    var search = $("#J_search_input").val();
    window.location.href = '../search/search-filter.html?search=' + escape(search);
}

$('#J_search_form').submit(function() {
    globalsearch();
    return false;
});
$("#J_search_btn").click(function() {
    globalsearch();
});

//跳转到专区或标签搜索页
function gotoArea(type, name, id) {
    //将专区或标签名称保存到sessionStorage，供后续页面使用，通过url传会乱码
    $.MALL_STORAGE.tmpSave('tmpSearchName', name);
    window.location.href = "../search/search-filter.html?type=" + type + "&id=" + id;
}
//跳转到配件专区列表
function gotoPartArea(type, name, id) {
    //将专区或标签名称保存到sessionStorage，供后续页面使用，通过url传会乱码
    $.MALL_STORAGE.tmpSave('tmpSearchName', name);
    window.location.href = "../search/parts-search-filter.html?type=" + type + "&id=" + id;
}

//构建品牌弹窗内容
srvMap.add("search-filter-param", "../../assets/data/search/search-filter-param.json", "front/sh/prod!queryMcdsScreenInfoInterface?uid=p003");

Util.ajax.postJson(srvMap.get("search-filter-param"), "", function(data, flag) {
    if (flag) {
        var brands = data.object.brands;
        var html = "";
        var search = $("#J_search_input").val();
        $(brands).each(function(index, e) {
            html += "<a brandid='" + e.brandID + "'>" + e.brandNM + "</a>";
        })
        $(".phone-wrap").html(html);
        //给a标签绑定事件
        $(".phone-wrap a").click(function() {
            var search = $("#J_search_input").val();
            window.location.href = '../search/search-filter.html?search=' + escape(search) + "&brandID=" + $(this).attr("brandid");
        })
    }
});
//品牌筛选弹窗
$(".filter-list").click(function() {
    //首先判断是否有遮罩层，如果没有则加上
    var mask = $(".ui-cover");
    var hideTime = 200;
    if (mask.length < 1) {
        $("body").append(ui_cover_bg);
        $(".ui-cover").click(function() {
                //隐藏品牌区域
                $(".ui-cover").remove();
                $(".phone-wrap").animate({
                    right: '1000%'
                }, hideTime);
            })
            //加载品牌区域
        $(".phone-wrap").show();
        $(".phone-wrap").animate({
            right: '0%'
        }, hideTime);
    } else {
        //隐藏品牌区域
        $(".ui-cover").remove();
        $(".phone-wrap").animate({
            right: '1000%'
        }, hideTime, function() {
            $(".phone-wrap").hide();
        });

    }
});
