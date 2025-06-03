const questionContainer = document.getElementById("question-container");
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answers");
const scoreDisplay = document.getElementById("score-value");

let currentQuestionIndex = 0;
let score = 0;
let questions = [];

async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error(`Lỗi ${response.status}`);
        const data = await response.json();

        return data.map(item => {
            if (item.type === "short") {
                if (!item.q || !Array.isArray(item.keywords)) {
                    console.warn(`Câu hỏi ngắn không hợp lệ: ${JSON.stringify(item)}`);
                    return null;
                }
                return {
                    question: item.q,
                    type: "short",
                    keywords: item.keywords
                };
            } else {
                if (!item.q || !item.op || !item.a || !item.op[item.a]) {
                    console.warn(`Câu hỏi không hợp lệ: ${JSON.stringify(item)}`);
                    return null;
                }
                return {
                    question: item.q,
                    options: Object.entries(item.op).map(([key, value]) => ({ key, value })),
                    answer: item.op[item.a]
                };
            }
        }).filter(item => item !== null);
    } catch (error) {
        console.error(`Lỗi khi tải dữ liệu từ API:`, error);
        questionElement.innerText = "Không thể tải câu hỏi. Vui lòng thử lại.";
        return [];
    }
}

async function startQuiz() {
    questions = await loadQuestions("data/QIS301.json");
    if (questions.length === 0) {
        questionElement.innerText = "Không có câu hỏi nào để hiển thị.";
        return;
    }
    showQuestion();
}

function showQuestion() {
    resetState();

    if (currentQuestionIndex >= questions.length) {
        questionElement.innerText = `Hoàn thành! Bạn đạt ${score}/${questions.length} điểm.`;
        answerButtons.innerHTML = "";
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    questionElement.innerText = currentQuestion.question;

    if (currentQuestion.type === "short") {
        showShortAnswer(currentQuestion);
    } else {
        showMultipleChoice(currentQuestion);
    }
}

function showMultipleChoice(question) {
    question.options.forEach(option => {
        const button = document.createElement("button");
        button.innerText = `${option.key}. ${option.value}`;
        button.classList.add("btn");
        button.dataset.key = option.key;
        button.addEventListener("click", () => selectAnswer(button, option.value, question.answer));
        answerButtons.appendChild(button);
    });
}

function showShortAnswer(question) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Nhập câu trả lời của bạn...";
    input.classList.add("short-answer");

    const submit = document.createElement("button");
    submit.innerText = "Gửi";
    submit.classList.add("btn");

    submit.addEventListener("click", () => {
        checkShortAnswer(input.value, question.keywords);
    });

    answerButtons.appendChild(input);
    answerButtons.appendChild(submit);
}

function selectAnswer(button, selectedOption, correctAnswer) {
    if (selectedOption === correctAnswer) {
        button.classList.add("correct");
        score++;
    } else {
        button.classList.add("wrong");
        const correctKey = questions[currentQuestionIndex].options.find(opt => opt.value === correctAnswer).key;
        const correctButton = Array.from(answerButtons.children).find(btn => btn.dataset.key === correctKey);
        if (correctButton) correctButton.classList.add("correct");
    }

    scoreDisplay.innerText = score;
    Array.from(answerButtons.children).forEach(btn => btn.disabled = true);

    setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
    }, 2000);
}

function checkShortAnswer(userInput, keywords) {
    const normalizedInput = userInput.toLowerCase().trim();
    const allMatched = keywords.every(keyword =>
        normalizedInput.includes(keyword.toLowerCase())
    );

    if (allMatched) {
        alert("Trả lời đúng!");
        score++;
    } else {
        alert("Trả lời chưa chính xác.");
    }

    scoreDisplay.innerText = score;

    setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
    }, 1000);
}

function resetState() {
    answerButtons.innerHTML = "";
}

if (!questionContainer || !questionElement || !answerButtons || !scoreDisplay) {
    console.error("Một hoặc nhiều phần tử DOM không tồn tại.");
    questionContainer.innerHTML = "<p>Lỗi: Không tìm thấy các phần tử giao diện cần thiết.</p>";
} else {
    startQuiz();
}
