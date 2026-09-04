/* 综测问答助手 - 界面交互逻辑
 * 依赖：markdown.js（ZongceMarkdown）、api.js（ZongceAPI）
 */
(function () {
  "use strict";

  var chatEl = document.getElementById("chat");
  var form = document.getElementById("input-form");
  var inputEl = document.getElementById("question-input");
  var sendBtn = document.getElementById("send-btn");
  var statusBadge = document.getElementById("status-badge");

  var pending = false; // 请求进行中禁止重复提交

  // 顶栏状态徽标：随 api.js 的配置自动切换
  function refreshStatusBadge() {
    var config = ZongceAPI.API_CONFIG;
    if (config.USE_MOCK) {
      statusBadge.textContent = "演示模式 · 模拟数据";
      statusBadge.className = "badge badge-mock";
    } else if (config.BASE_URL && config.QUERY_ENDPOINT) {
      statusBadge.textContent = "已连接后端";
      statusBadge.className = "badge badge-live";
    } else {
      statusBadge.textContent = "接口未配置";
      statusBadge.className = "badge badge-warn";
    }
  }

  function scrollToBottom() {
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function removeWelcome() {
    var welcome = chatEl.querySelector(".welcome");
    if (welcome) {
      welcome.remove();
    }
  }

  // role: user | assistant | error | typing
  function addMessage(role, html, sources) {
    var message = document.createElement("div");
    message.className = "message message-" + role;

    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;
    message.appendChild(bubble);

    if (sources && sources.length) {
      bubble.appendChild(buildSources(sources));
    }

    chatEl.appendChild(message);
    scrollToBottom();
    return message;
  }

  // 引用片段（溯源）折叠面板
  function buildSources(sources) {
    var details = document.createElement("details");
    details.className = "sources";

    var summary = document.createElement("summary");
    summary.textContent = "📎 引用片段（" + sources.length + "）· 点击展开";
    details.appendChild(summary);

    var list = document.createElement("ul");
    sources.forEach(function (source) {
      var item = document.createElement("li");

      var page = document.createElement("span");
      page.className = "page";
      page.textContent = "第 " + (source.page == null ? "?" : source.page) + " 页";

      var text = document.createElement("span");
      text.className = "text";
      text.textContent = source.text || "";

      item.appendChild(page);
      item.appendChild(text);
      list.appendChild(item);
    });
    details.appendChild(list);
    return details;
  }

  function showTyping() {
    return addMessage(
      "typing",
      '<span class="dots"><span></span><span></span><span></span></span> 正在检索综测规则…'
    );
  }

  function showError(err) {
    var hint = ZongceAPI.API_CONFIG.USE_MOCK
      ? "<li>当前是演示模式，请检查浏览器控制台的网络与报错信息</li>"
      : "<li>确认后端服务已启动，且 api.js 中 BASE_URL / QUERY_ENDPOINT 配置正确</li>" +
        "<li>首次提问需要建向量索引，若超时请调大 api.js 中的 TIMEOUT_MS 后重试</li>";
    addMessage(
      "error",
      "<strong>查询失败：" + ZongceMarkdown.escapeHtml(err.message || "未知错误") + "</strong><ul>" + hint + "</ul>"
    );
  }

  function ask(question) {
    if (pending || !question.trim()) {
      return;
    }
    pending = true;
    sendBtn.disabled = true;

    removeWelcome();
    // 用户消息用 textContent 防注入
    var userMsg = document.createElement("div");
    userMsg.className = "message message-user";
    var userBubble = document.createElement("div");
    userBubble.className = "bubble";
    userBubble.textContent = question;
    userMsg.appendChild(userBubble);
    chatEl.appendChild(userMsg);

    var typing = showTyping();
    ZongceAPI.queryZongce(question)
      .then(function (result) {
        typing.remove();
        addMessage("assistant", ZongceMarkdown.render(result.answer), result.sources);
      })
      .catch(function (err) {
        typing.remove();
        showError(err);
      })
      .finally(function () {
        pending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      });
  }

  // 表单提交
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var question = inputEl.value.trim();
    if (!question) {
      return;
    }
    inputEl.value = "";
    autoResize();
    ask(question);
  });

  // Enter 发送、Shift+Enter 换行；中文输入法组词期间不触发
  inputEl.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  // 输入框高度自适应
  function autoResize() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
  }
  inputEl.addEventListener("input", autoResize);

  // 示例问题点击直接提问
  document.querySelectorAll(".example-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      ask(chip.dataset.question);
    });
  });

  refreshStatusBadge();
  inputEl.focus();
})();
