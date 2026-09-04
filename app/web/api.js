/* ============================================================
 * 综测问答助手 —— 接口层（预留）
 * ------------------------------------------------------------
 * 前端所有请求都经过本文件；后端 HTTP 服务实现之后，只需要：
 *   1. 把 USE_MOCK 改为 false
 *   2. 填入 BASE_URL 和 QUERY_ENDPOINT
 * 其余文件一律不用动。
 *
 * 【接口约定】（后端按此实现即可直接接入）
 *   POST {BASE_URL}{QUERY_ENDPOINT}
 *   请求头: Content-Type: application/json
 *   请求体: { "question": "用户问题，UTF-8 字符串" }
 *   响应体: {
 *     "answer":  "Markdown 字符串，结构化回答",
 *     "sources": [ { "page": 5, "text": "引用的文档片段原文" } ]
 *   }
 *   错误: 非 2xx 状态码，或 { "error": "错误说明" }
 *
 * 注意：后端首次提问需要先为整份 PDF 建向量索引，
 * 建议超时不低于 60 秒（TIMEOUT_MS）。
 * ============================================================ */

(function (global) {
  "use strict";

  var API_CONFIG = {
    // TODO: 后端就绪后改为 false，并填写下面两项
    USE_MOCK: true,

    // TODO: 后端服务地址，例如 "http://127.0.0.1:8000"
    BASE_URL: "",

    // TODO: 问答接口路径，例如 "/api/query"
    QUERY_ENDPOINT: "",

    TIMEOUT_MS: 60000,
  };

  /* 真实请求：接口约定见文件顶部注释 */
  function request(question) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, API_CONFIG.TIMEOUT_MS);

    return fetch(API_CONFIG.BASE_URL + API_CONFIG.QUERY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question }),
      signal: controller.signal,
    })
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error("接口返回 HTTP " + resp.status);
        }
        return resp.json();
      })
      .then(function (data) {
        if (data && data.error) {
          throw new Error(data.error);
        }
        return {
          answer: (data && data.answer) || "",
          sources: (data && data.sources) || [],
        };
      })
      .finally(function () {
        clearTimeout(timer);
      });
  }

  /* 模拟数据：结构与真实接口的响应完全一致，用于先调通界面 */
  function mockResponse(question) {
    return {
      answer:
        "## 🔍 查询结果\n" +
        "\n" +
        "### 查询问题\n" +
        "> " + question + "\n" +
        "\n" +
        "### 相关条款\n" +
        "\n" +
        "#### 条款 1：学术科技 —— 学科竞赛获奖加分\n" +
        "**所属章节**：（二）学术科技（40 分）\n" +
        "\n" +
        "**条款内容**：\n" +
        "> 代表学校参加各级各类学科竞赛获奖，学术科技加分累计不超过 40 分。\n" +
        "\n" +
        "| 竞赛 | 特等 | 一等 | 二等 | 三等 | 优秀 |\n" +
        "|------|-----|-----|-----|-----|-----|\n" +
        "| 中国国际大学生创新大赛 | 30 | 25 | 20 | — | 4 |\n" +
        "| “巴渝杯”网络安全联赛 | 5 | 5 | 4 | 3 | 0 |\n" +
        "| “认证杯”数学建模网络挑战赛 | 3 | 3 | 2 | 1 | 0 |\n" +
        "\n" +
        "**适用条件**：代表学校参赛；同一学年内学术科技类加分累计不超过 40 分。\n" +
        "\n" +
        "---\n" +
        "\n" +
        "### 📋 要点总结\n" +
        "- 中国国际大学生创新大赛特等奖可加 30 分\n" +
        "- “认证杯”系列比赛只取最高奖项、只加一次\n" +
        "- 学术科技类加分设有 40 分上限\n" +
        "\n" +
        "### ⚠️ 注意事项\n" +
        "- 当前为**演示模式**的模拟数据，接入后端接口后将展示真实检索结果",
      sources: [
        {
          page: 8,
          text: "学术科技（40 分）：代表西南大学参加各级各类学科竞赛获奖、公开发表学术论文，加分累计不超过 40 分……",
        },
        {
          page: 6,
          text: "参加的团队竞赛项目排名前 3 按 100% 奖励分值计分，排名 4-5 按 50% 计分，第 6 名以后的同学按 20% 计分……",
        },
        {
          page: 5,
          text: "专业技能职业比赛：国家级奖特等奖 15 分、一等奖 14 分、二等奖 12 分、三等奖 10 分、单项奖 5 分……",
        },
      ],
    };
  }

  /* 对外唯一入口：提问并返回 { answer, sources } */
  function queryZongce(question) {
    if (API_CONFIG.USE_MOCK) {
      // 模拟网络与生成延迟
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(mockResponse(question));
        }, 1200);
      });
    }

    if (!API_CONFIG.BASE_URL || !API_CONFIG.QUERY_ENDPOINT) {
      return Promise.reject(
        new Error("接口未配置：请在 api.js 中填写 BASE_URL 和 QUERY_ENDPOINT（或先将 USE_MOCK 设回 true）")
      );
    }

    return request(question);
  }

  global.ZongceAPI = { API_CONFIG: API_CONFIG, queryZongce: queryZongce };
})(window);
