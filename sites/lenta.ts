import axios from "axios";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import chalk from "chalk";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

type Categories = {
  name: string;
  href: string;
  code: number;
};

const csvWriter = createObjectCsvWriter({
  path: "lenta.csv",
  header: [
    { id: "date", title: "Дата" },
    { id: "network", title: "Сеть" },
    { id: "address", title: "Адрес" },
    { id: "category", title: "Категория" },
    { id: "sku", title: "SKU" },
    { id: "price", title: "Цена" },
  ],
  encoding: "utf8",
});
const baseUrl = "https://lenta.com/catalog/";
const categories: Categories[] = [
  {
    name: "Водка",
    href: "/vodka-17068/",
    code: 17068,
  },
  {
    name: "Настойки",
    href: "/nastojjki-18108/ ",
    code: 18108,
  },
  {
    name: "Ром",
    href: "/rom-17069/",
    code: 17069,
  },
  {
    name: "Джин",
    href: "/dzhin-18106/",
    code: 18106,
  },
  {
    name: "Текила",
    href: "/tekila-18107/",
    code: 18107,
  },
  {
    name: "Ликеры",
    href: "/likery-17070/",
    code: 17070,
  },
  {
    name: "Бальзамы, биттеры, абсент",
    href: "/balzamy-bittery-absent-18109/",
    code: 18109,
  },
  {
    name: "Коньяк",
    href: "/konyak-17066/",
    code: 17066,
  },
  {
    name: "Бренди",
    href: "/brandi-18105/",
    code: 18105,
  },
  {
    name: "Виски",
    href: "/viski-17067/",
    code: 17067,
  },
];

async function getHeaders() {
  chromium.use(StealthPlugin());
  const browser = await chromium.launch({
    headless: true,
    // args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({});
  const page = await context.newPage();
  let headers = {};
  page.on("request", async (request) => {
    if (request.url() == "https://lenta.com/api-gateway/v1/catalog/items")
      headers = await request.allHeaders();
  });
  await page.goto("https://lenta.com/catalog/viski-17067/");
  await page.waitForTimeout(5000);
  await browser.close();
  console.log(headers);
  return headers;
}

async function getAllStores() {
  const options = {
    method: "POST",
    url: "https://lenta.com/api-gateway/v1/stores/pickup/search",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      baggage:
        "sentry-environment=production,sentry-release=web-12.0.144,sentry-public_key=b99355c72549498d9e9075cc3d4006a2,sentry-trace_id=5767525c133244239c536c0f8e9dea2f,sentry-sample_rate=1,sentry-sampled=true",
      "cache-control": "no-cache",
      deviceid: "6337fa67-4cde-78cc-f566-271867eb3db1",
      experiments:
        "exp_recommendation_cms.true, exp_apigw_purchase.test, exp_lentapay.test, exp_omni_price.test, exp_profile_bell.test, exp_newui_cancel_order.test, exp_newui_history_active_action.test_stars, exp_comment_picker_and_courier.test, exp_general_editing_page.test, exp_cl_omni_support.test, exp_cl_omni_authorization.test, exp_onboarding_sbp.default, exp_fullscreen.test, exp_profile_login.false, exp_new_notifications_show_unauthorized.test, exp_assembly_cost_location.cart, exp_search_bottom.default, exp_onboarding_editing_order.test, exp_cart_new_carousel.default, exp_newui_cart_cancel_editing.test, exp_newui_cart_button.test, exp_new_promov3., exp_sbp_enabled.test, exp_new_my_goods.test, exp_ui_catalog.test, exp_search_out_of_stock.default, exp_profile_settings_email.default, exp_cl_omni_refusalprintreceipts.test, exp_cl_omni_refusalprintcoupons.test, exp_accrual_history.test, exp_personal_recommendations.test_B, exp_newui_chips.test, exp_loyalty_categories.test, exp_growthbooks_aa.OFF, exp_test_ch_web.def, exp_search_suggestions_popular_sku.default, exp_cancel_subscription.test_2, exp_manage_subscription.control, exp_cl_new_csi.default, exp_cl_new_csat.default, exp_delivery_price_info.test, exp_personal_promo_navigation.test, exp_web_feature_test.false, exp_interval_jump.test, exp_cardOne_promo_type.test, exp_qr_cnc.test, exp_popup_about_order.test, exp_apigw_recommendations.test, exp_where_place_cnc.test, exp_editing_cnc_onboarding.default, exp_editing_cnc.default, exp_selection_carousel.test, exp_pickup_in_delivery.false, exp_feature_kpp_test.false, exp_welcome_onboarding.default, exp_cl_new_splash.default, exp_web_referral_program_type.default, exp_where_place_new.test, exp_start_page.default, exp_promocode_bd_coupon.default, exp_personal_promo_swipe_animation.default, exp_default_payment_type.default, exp_main_page_carousel_vs_banner.default, exp_start_page_onboarding.default, exp_newui_cart_check_edit.default, exp_search_new_logic.default, exp_search_ds_pers_similar.default, exp_growthbooks_aa_id_based_feature.control, exp_referral_program_type.default, exp_new_action_pages.default, exp_my_choice_search.test, exp_items_by_rating.test, exp_can_accept_early.default, exp_test_gb_value.false, exp_online_subscription.default, exp_new_nps_keyboard.test, exp_web_b2b_cancel_to_edit.test, exp_web_cancel_to_edit.test, exp_main_page_carousel_vs_banner_shop.default, exp_bathcing.default, exp_web_qr_cnc.default, exp_hide_cash_payment_for_cnc_wo_adult_items.default, exp_web_promocode_bd_coupon.default, exp_prices_per_quantum.default, exp_test.default_new, exp_web_partner_coupons_separately.default, exp_web_chips_online.test, exp_item_name.control, exp_b2b_web_redesign_reg.test, exp_chips_online.default, exp_b2b_web_pay_the_bills.control, exp_promo_without_benefit.default, exp_cnc_writing_interval.default, exp_cart_forceFillDelivery.default, exp_search_related_cat_new_logic.default, exp_big_card.control, exp_web_cart_new_carousel.test, exp_banner_sbp_checkout_step_3.default, exp_badge_sbp_checkout_step_3.test_B, exp_kit_banner_sbp_checkout_step_3.default, exp_kit_badge_sbp_checkout_step_3.default, exp_header_thanks_you_page.default, exp_b2b_header_thanks_you_page.default, exp_web_sbp_show.default, exp_profile_stories.test, exp_checkout_cart_promocode.default, exp_discovery_club.default, exp_card1_onboarding.default, exp_b2b_card_onboarding.Default, exp_main_page_recipe_pp.default, exp_main_page_recipe_pp_shop.default, exp_aa_test_2025_04.default, exp_search_items_by_date.default, exp_product_page_by_blocks.Default, exp_b2b_web_redesign_profile.default, exp_without_a_doorbell.default, exp_without_a_doorbell_new.default, exp_edit_payment_type.default, exp_edit_payment_type_new.default, exp_search_photo_positions.Default, exp_sbp_in_subscription_purchase.default, exp_partner_coupons_separately.default, exp_better_pickup_in_personal_promo.default, exp_web_delivery_promocode_bd_coupon.default, exp_new_matrix.test, exp_another_button_ch.default, exp_progressbar_and_title.default, exp_why_offline_payment.default",
      origin: "https://lenta.com",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://lenta.com/catalog/vodka-nastojjki-18355/",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sentry-trace": "5767525c133244239c536c0f8e9dea2f-a6f35a314812acf6-1",
      sessiontoken: "4C3805871D1139006322D9D8C34BE692",
      traceparent: "00-c4e22a26ce2e27daaaaf9f4b3b18b956-7bf99b9b9e414af7-01",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "x-delivery-mode": "pickup",
      "x-device-id": "6337fa67-4cde-78cc-f566-271867eb3db1",
      "x-device-os": "Web",
      "x-device-os-version": "12.4.8",
      "x-domain": "moscow",
      "x-platform": "omniweb",
      "x-retail-brand": "lo",
      "x-span-id": "7bf99b9b9e414af7",
      "x-trace-id": "c4e22a26ce2e27daaaaf9f4b3b18b956",
    },
    data: {},
  };
  const response = await axios.request(options);
  const allStores = response.data.items;
  return allStores;
}

async function getProducts(headers: object, categoryId: number, page: number) {
  const cleanHeaders = Object.entries(headers).reduce((acc, [key, value]) => {
    if (!key.startsWith(":")) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  const options = {
    method: "POST",
    url: "https://lenta.com/api-gateway/v1/catalog/items",
    headers: cleanHeaders,
    data: {
      filters: { range: [], checkbox: [], multicheckbox: [] },
      categoryId: categoryId,
      sort: { type: "popular", order: "desc" },
      limit: 40,
      offset: 0,
    },
  };
  const response = await axios.request(options);
  const products = response.data;
  return products;
}

export async function getLenta(pc: ProgressCallback) {
  let headers = await getHeaders();
  const allStores = await getAllStores();
  pc({ task: allStores.length });
  for (let i = 0; i < allStores.length; i++) {
    const start = Date.now();
    await Promise.all(
      categories.map(async (category: Categories) => {
        let productsArr: any[] = [];
        const start = Date.now();
        const pages = await getProducts(headers, category.code, 0);
        for (let j = 0; j < Math.ceil(pages.total / 40); j++) {
          const products = await getProducts(headers, category.code, j);
          products.items.map((product) => productsArr.push(product));
        }
        const records = productsArr.map((product) => ({
          date: new Date().toISOString(),
          network: "Лента",
          address: allStores[i]!.addressFull,
          category: product.name.split(" ")[0],
          sku: product.name,
          price: product.prices.price,
        }));
        await csvWriter.writeRecords(records);
        console.log(
          `category ${category.name} fetched as ${Date.now() - start}`
        );
      })
    );
    headers = Object.entries(await getHeaders()).reduce((acc, [key, value]) => {
      if (!key.startsWith(":")) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    console.log(
      chalk.greenBright(
        `store ${allStores[0].storeAddress} fetched as ${Date.now() - start}`
      )
    );
    pc({ done: i + 1 });
  }
}
// 429 ошибка, to many requests, пока хз как фиксить
