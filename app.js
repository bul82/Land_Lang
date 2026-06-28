// ==========================================================================
// Liberty Academy App Logic - Premium US Relocation English School
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 1. Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Nav Toggle
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const menuIcon = document.getElementById('menu-icon');

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', () => {
            mobileDrawer.classList.toggle('active');
            const isActive = mobileDrawer.classList.contains('active');
            if (menuIcon && typeof lucide !== 'undefined') {
                menuIcon.setAttribute('data-lucide', isActive ? 'x' : 'menu');
                lucide.createIcons();
            }
        });
    }

    // Initialize Quiz Wizard
    initQuiz();

    // Initialize Countdown Timer for next lesson
    initCountdown();

    // Initialize Vocabulary List and Trainer
    initVocab();
});

// Helper: Close mobile drawer menu
function closeMobileMenu() {
    const mobileDrawer = document.getElementById('mobileDrawer');
    const menuIcon = document.getElementById('menu-icon');
    if (mobileDrawer) {
        mobileDrawer.classList.remove('active');
        if (menuIcon && typeof lucide !== 'undefined') {
            menuIcon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        }
    }
}

// Scroll to section helper
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================================================
// 3. Quiz Wizard Logic (Level Test)
// ==========================================================================
let currentQuizStep = 1;
const totalQuizSteps = 5;
const quizAnswers = { q1: null, q2: null, q3: null, q4: null, q5: null };

// Correct Answers mapping
const quizAnswersKey = {
    q1: 'b', // utilities included
    q2: 'b', // drop the ball = mistake
    q3: 'b', // get down to business (also 'c' brass tacks is accepted in JS validation)
    q4: 'b', // subjunctive "he submit"
    q5: 'b'  // swamped = busy / touch base = connect
};

function initQuiz() {
    const prevBtn = document.getElementById('prevQuizBtn');
    const nextBtn = document.getElementById('nextQuizBtn');
    
    if (!prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
        if (currentQuizStep > 1) {
            navigateQuizStep(currentQuizStep - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        // Verify current question is answered
        const currentActive = document.querySelector(`.quiz-step[data-step="${currentQuizStep}"]`);
        const checkedInput = currentActive.querySelector('input[type="radio"]:checked');
        
        if (!checkedInput) {
            alert('Пожалуйста, выберите один из вариантов ответа.');
            return;
        }

        // Save answer
        const qName = checkedInput.name;
        quizAnswers[qName] = checkedInput.value;

        if (currentQuizStep < totalQuizSteps) {
            navigateQuizStep(currentQuizStep + 1);
        } else {
            showQuizResults();
        }
    });
}

function navigateQuizStep(step) {
    // Hide all steps
    document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'));
    
    // Show target step
    const targetStep = document.querySelector(`.quiz-step[data-step="${step}"]`);
    if (targetStep) targetStep.classList.add('active');

    // Update state
    currentQuizStep = step;

    // Update Progress Bar
    const progressPct = (step / totalQuizSteps) * 100;
    document.getElementById('testProgressBar').style.width = `${progressPct}%`;
    document.getElementById('testProgressText').innerText = `Вопрос ${step} из ${totalQuizSteps}`;

    // Update Nav Buttons
    const prevBtn = document.getElementById('prevQuizBtn');
    const nextBtn = document.getElementById('nextQuizBtn');
    prevBtn.disabled = (step === 1);
    
    if (step === totalQuizSteps) {
        nextBtn.innerHTML = `Показать результаты <i data-lucide="check" class="icon-small"></i>`;
    } else {
        nextBtn.innerHTML = `Далее <i data-lucide="arrow-right" class="icon-small"></i>`;
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showQuizResults() {
    // Hide quiz steps and wizard footer controls
    document.getElementById('quizBody').style.display = 'none';
    document.querySelector('.test-controls').style.display = 'none';
    document.querySelector('.test-progress-wrapper').style.display = 'none';

    // Calculate score
    let score = 0;
    for (let key in quizAnswersKey) {
        if (key === 'q3') {
            // Accept either business (b) or brass tacks (c) for q3 idiom
            if (quizAnswers[key] === 'b' || quizAnswers[key] === 'c') {
                score++;
            }
        } else {
            if (quizAnswers[key] === quizAnswersKey[key]) {
                score++;
            }
        }
    }

    // Determine level and track recommendations
    let level = 'A2';
    let trackName = 'Survival English & Relocation Basics';
    let description = 'Вы делаете первые шаги. Выживете на Брайтон-Бич без английского, но за его пределами будет сложно. Рекомендуем трак Survival English, чтобы научиться объяснять копам, что вы просто заблудились, а не нарушаете закон.';

    if (score >= 5) {
        level = 'C1';
        trackName = 'American Accent & Integration';
        description = 'Ваш уровень C1. Вы говорите почти как коренной житель Техаса, но жесткое русское "Hello" все еще выдает в вас тайного агента. Рекомендуем трак American Accent, чтобы окончательно слиться с американцами и освоить мемы.';
    } else if (score >= 3) {
        level = 'B2';
        trackName = 'Business & FAANG Career';
        description = 'Отличный уровень! Вы почти готовы к FAANG, но аккуратнее с фразами вроде "I want money" на питче инвесторам. Рекомендуем трак Business & FAANG, чтобы отточить софт-скиллы и искусство улыбаться 2 часа подряд.';
    } else if (score >= 1) {
        level = 'B1';
        trackName = 'USA Academic & Visa Prep';
        description = 'У вас есть база! Вы можете купить латте в Старбаксе с первой попытки (почти). Но на вопрос консула США "What is your purpose of travel?" вы все еще рискуете ответить "Yes". Рекомендуем трак USA Academic & Visa Prep.';
    }

    // Pop results values
    document.getElementById('quizScoreNumber').innerText = level;
    document.getElementById('quizResultDescription').innerText = description;
    document.getElementById('quizRecommendedTrack').innerText = trackName;
    
    // Auto-select level in form
    const formLevelSelect = document.getElementById('userLevel');
    if (formLevelSelect) {
        if (level === 'C1') formLevelSelect.value = 'C1-C2';
        else if (level === 'B2') formLevelSelect.value = 'B2';
        else if (level === 'B1') formLevelSelect.value = 'B1';
        else formLevelSelect.value = 'A1-A2';
    }

    // Display Results Container
    document.getElementById('testResultScreen').style.display = 'block';
}

function resetQuiz() {
    // Reset state
    currentQuizStep = 1;
    for (let key in quizAnswers) {
        quizAnswers[key] = null;
    }
    
    // Reset radio buttons
    document.querySelectorAll('.quiz-option input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // Reset visibility
    document.getElementById('quizBody').style.display = 'block';
    document.querySelector('.test-controls').style.display = 'flex';
    document.querySelector('.test-progress-wrapper').style.display = 'block';
    document.getElementById('testResultScreen').style.display = 'none';

    // Navigate to step 1
    navigateQuizStep(1);
}


// ==========================================================================
// 4. Audio Introduction Simulator
// ==========================================================================
let currentAudioTeacher = null;
let audioSubtitlesInterval = null;

const teacherAudioSubtitles = window.teacherAudioSubtitles || {
    john: [
        { time: 0, text: "Hello there! My name is John Davis." },
        { time: 2, text: "I'm a native English speaker from sunny California." },
        { time: 5, text: "My specialty is helping relocators break the language barrier," },
        { time: 8, text: "sharpen their General American Accent, and score high on TOEFL." },
        { time: 12, text: "Let's make your American Dream come true together at Liberty!" }
    ],
    sarah: [
        { time: 0, text: "Hi! I'm Sarah Miller from New York City." },
        { time: 2, text: "Welcome to my immersive English programs!" },
        { time: 4, text: "We will explore active American slang, speaking habits," },
        { time: 7, text: "and simulate coffee meetups to build confidence in NY." },
        { time: 10, text: "Can't wait to see you in our dynamic speaking club. Cheers!" }
    ],
    david: [
        { time: 0, text: "Greetings. I'm David King, native speaker from Austin, Texas." },
        { time: 3, text: "Are you aiming for a career at Google, Amazon, or US startups?" },
        { time: 7, text: "We will focus on professional communication, pitch templates," },
        { time: 10, text: "and custom interview preparation to impress American managers." }
    ]
};

function playTeacherAudio(btnElement, teacherKey) {
    const simulator = document.getElementById('audioSimulator');
    const playIcons = document.querySelectorAll('.play-icon');
    const pauseIcons = document.querySelectorAll('.pause-icon');
    const playButtons = document.querySelectorAll('.btn-play-audio');

    // If clicking same teacher who is currently playing, we pause/stop
    if (currentAudioTeacher === teacherKey) {
        stopTeacherAudio();
        return;
    }

    // Stop current playing audio
    stopTeacherAudio();

    currentAudioTeacher = teacherKey;

    // UI Feedback: Set active button state
    btnElement.classList.add('playing');
    btnElement.querySelector('.play-icon').style.display = 'none';
    btnElement.querySelector('.pause-icon').style.display = 'inline-block';

    // Open Subtitle Bar
    simulator.classList.add('active');
    
    // Set teacher text
    const displayNames = { john: 'John Davis (California)', sarah: 'Sarah Miller (New York)', david: 'David King (Texas)' };
    document.getElementById('audioTeacherName').innerText = displayNames[teacherKey] || 'Teacher';

    // Subtitle Simulation Timer
    let elapsedSeconds = 0;
    const subtitlesList = teacherAudioSubtitles[teacherKey];
    
    // Set initial text
    document.getElementById('audioSubtitles').innerText = subtitlesList[0].text;

    // Native Speech Synthesis Integration
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop any pending speech
        const fullText = subtitlesList.map(sub => sub.text).join(" ");
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = 'en-US';
        
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        if (teacherKey === 'sarah') {
            selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.toLowerCase().includes('female')));
        } else {
            selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('David') || v.name.toLowerCase().includes('male')));
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 0.95; // Real-life speech rate
        window.speechSynthesis.speak(utterance);
    }

    audioSubtitlesInterval = setInterval(() => {
        elapsedSeconds++;
        const currentSub = subtitlesList.find(sub => sub.time === elapsedSeconds);
        if (currentSub) {
            document.getElementById('audioSubtitles').innerText = currentSub.text;
        }

        // Loop end condition
        const lastSub = subtitlesList[subtitlesList.length - 1];
        if (elapsedSeconds > lastSub.time + 4) {
            stopTeacherAudio();
        }
    }, 1000);
}

function stopTeacherAudio() {
    if (audioSubtitlesInterval) {
        clearInterval(audioSubtitlesInterval);
        audioSubtitlesInterval = null;
    }
    
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    currentAudioTeacher = null;

    // Reset Buttons UI
    document.querySelectorAll('.btn-play-audio').forEach(btn => {
        btn.classList.remove('playing');
        btn.querySelector('.play-icon').style.display = 'inline-block';
        btn.querySelector('.pause-icon').style.display = 'none';
    });

    // Hide Subtitle Bar
    const simulator = document.getElementById('audioSimulator');
    if (simulator) {
        simulator.classList.remove('active');
    }
}


// ==========================================================================
// 5. Interactive Schedule & Timezone Logic
// ==========================================================================
let currentSelectedTimezone = 'MSK';
let selectedSlotInfo = null;

const baseMoscowHours = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "18:30", "19:00", "20:00", "21:00"];

// Timezone offset shift relative to Moscow (UTC+3)
// EST: -7 hours (in June relative to Moscow)
// PST: -10 hours (in June relative to Moscow)
const timezoneShifts = {
    MSK: 0,
    EST: -7,
    PST: -10
};

function changeTimezone(tzKey) {
    // Toggle active state in buttons
    document.querySelectorAll('.tz-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tz-btn[data-tz="${tzKey}"]`).classList.add('active');

    currentSelectedTimezone = tzKey;

    // Update slots times
    document.querySelectorAll('.slots-list').forEach(slotCol => {
        slotCol.querySelectorAll('.slot-btn:not(.booked)').forEach(btn => {
            const baseTime = btn.getAttribute('data-time');
            if (baseTime) {
                const shiftedTime = calculateShiftedTime(baseTime, timezoneShifts[tzKey]);
                btn.innerText = shiftedTime;
            }
        });
    });

    // Update indicator info if something was selected
    if (selectedSlotInfo) {
        const updatedTime = calculateShiftedTime(selectedSlotInfo.baseTime, timezoneShifts[tzKey]);
        document.getElementById('selectedSlotIndicator').innerHTML = `Выбрано: <strong>${selectedSlotInfo.day} в ${updatedTime} (${tzKey})</strong>`;
        
        // Sync values to form
        document.getElementById('selectedSlotText').innerText = `${selectedSlotInfo.day} в ${updatedTime} (${tzKey})`;
    }
}

function calculateShiftedTime(timeStr, offsetHours) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let shiftedHours = hours + offsetHours;
    
    if (shiftedHours < 0) {
        shiftedHours = 24 + shiftedHours;
    } else if (shiftedHours >= 24) {
        shiftedHours = shiftedHours - 24;
    }

    const paddedHours = String(shiftedHours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
}

function selectSlot(btnElement, day, baseTime) {
    // Clear previous selected slot class
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));

    // Highlight selected button
    btnElement.classList.add('selected');

    // Save Selection State
    selectedSlotInfo = { day, baseTime };

    // Update Indicator text
    const shiftedTime = calculateShiftedTime(baseTime, timezoneShifts[currentSelectedTimezone]);
    document.getElementById('selectedSlotIndicator').innerHTML = `Выбрано: <strong>${day} в ${shiftedTime} (${currentSelectedTimezone})</strong>`;

    // Enable scheduling CTA
    document.getElementById('scheduleBookBtn').disabled = false;

    // Sync elements with Trial Lesson Form
    const slotReflection = document.getElementById('formSlotReflection');
    slotReflection.style.display = 'flex';
    document.getElementById('selectedSlotText').innerText = `${day} в ${shiftedTime} (${currentSelectedTimezone})`;
    
    // Set hidden inputs
    document.getElementById('hiddenSlotDate').value = day;
    document.getElementById('hiddenSlotTime').value = `${shiftedTime} (${currentSelectedTimezone})`;
}

// Clear selected slot helper in form
function clearSelectedSlot(e) {
    if (e) e.preventDefault();
    
    // Reset buttons state
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Clear selection
    selectedSlotInfo = null;
    
    // Reset indicators
    document.getElementById('selectedSlotIndicator').innerHTML = `<span>Время не выбрано. Нажмите на любое активное время в сетке.</span>`;
    document.getElementById('scheduleBookBtn').disabled = true;
    
    // Hide form reflection
    document.getElementById('formSlotReflection').style.display = 'none';
    document.getElementById('hiddenSlotDate').value = '';
    document.getElementById('hiddenSlotTime').value = '';
}


// ==========================================================================
// 6. Pricing Toggle Logic
// ==========================================================================
let billingCycle = 'monthly'; // monthly or yearly

const basePrices = window.pricingData || {
    base: { monthly: 18500, yearly: 14800 },
    pro: { monthly: 32000, yearly: 25600 },
    vip: { monthly: 75000, yearly: 60000 }
};

function toggleBillingPeriod() {
    const btn = document.getElementById('priceToggleBtn');
    const labelMonthly = document.getElementById('labelMonthly');
    const labelYearly = document.getElementById('labelYearly');

    if (billingCycle === 'monthly') {
        billingCycle = 'yearly';
        btn.classList.add('yearly');
        labelYearly.classList.add('active');
        labelMonthly.classList.remove('active');
    } else {
        billingCycle = 'monthly';
        btn.classList.remove('yearly');
        labelMonthly.classList.add('active');
        labelYearly.classList.remove('active');
    }

    // Update DOM prices
    document.getElementById('priceBase').innerText = formatPrice(basePrices.base[billingCycle]);
    document.getElementById('pricePro').innerText = formatPrice(basePrices.pro[billingCycle]);
    document.getElementById('priceVip').innerText = formatPrice(basePrices.vip[billingCycle]);

    const periodSuffix = billingCycle === 'monthly' ? '/ месяц' : '/ мес. (при оплате за год)';
    document.getElementById('periodBase').innerText = periodSuffix;
    document.getElementById('periodPro').innerText = periodSuffix;
    document.getElementById('periodVip').innerText = periodSuffix;
}

function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}


// ==========================================================================
// 7. Booking Form Handler
// ==========================================================================
function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = form.name.value;
    const contact = form.contact.value;
    const level = form.level.options[form.level.selectedIndex].text;
    const slotDate = document.getElementById('hiddenSlotDate').value;
    const slotTime = document.getElementById('hiddenSlotTime').value;

    const modal = document.getElementById('successModal');
    const successText = document.getElementById('successModalText');
    const successSlotText = document.getElementById('successSlotText');
    const successSlotSummary = document.getElementById('successSlotSummary');

    // Customize dialog depending on slot availability
    if (slotDate && slotTime) {
        successText.innerText = `Спасибо, ${name}! Мы зарезервировали выбранный слот в расписании. Свяжемся с вами по контакту "${contact}" в течение 10 минут для подтверждения.`;
        successSlotText.innerText = `${slotDate} в ${slotTime}`;
        successSlotSummary.style.display = 'flex';
    } else {
        successText.innerText = `Спасибо, ${name}! Мы свяжемся с вами по контакту "${contact}" в течение 10 минут, чтобы согласовать удобное время для первого урока.`;
        successSlotSummary.style.display = 'none';
    }

    // Show Modal
    modal.style.display = 'flex';
    
    // Send data to backend
    fetch('/land-lang/api/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            contact: contact,
            level: level,
            date: slotDate || 'Не указана',
            time: slotTime || 'Не указано'
        })
    }).catch(err => console.error('Error sending booking to backend:', err));

    // Clear fields
    form.reset();
    clearSelectedSlot(null);
}


function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}


// ==========================================================================
// 8. Personal Account Simulation Logic (Student Cabinet Dashboard)
// ==========================================================================
let currentCabinetTab = 'home';
let vocabList = [
    { eng: 'to run custom verification', rus: 'выполнять индивидуальную проверку', cat: 'Relocation' },
    { eng: 'to touch base', rus: 'связаться / обсудить детали', cat: 'Business' },
    { eng: 'to drop the ball', rus: 'совершить промах / допустить ошибку', cat: 'Idioms' },
    { eng: 'to be swamped', rus: 'быть крайне занятым', cat: 'Slang' },
    { eng: 'general contractor', rus: 'генеральный подрядчик', cat: 'Business' },
    { eng: 'green card holder', rus: 'держатель грин-карты', cat: 'Relocation' },
    { eng: 'credit score history', rus: 'кредитная история', cat: 'Relocation' },
    { eng: 'to touch base', rus: 'переговорить / выйти на связь', cat: 'Idioms' },
    { eng: 'fair share', rus: 'справедливая доля', cat: 'Idioms' },
    { eng: 'relocation package', rus: 'социальный пакет релокации', cat: 'Relocation' },
    { eng: 'down payment', rus: 'первоначальный взнос (при покупке)', cat: 'Relocation' },
    { eng: 'cut corners', rus: 'халтурить / идти в обход правил', cat: 'Idioms' }
];

let trainerWordIndex = 0;

function toggleCabinetModal() {
    const cabinetModal = document.getElementById('cabinetModal');
    cabinetModal.classList.toggle('active');
    
    // Lock/Unlock body scroll
    if (cabinetModal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
        // Auto-refresh layout content
        renderVocabTable();
        updateCabinetWordTrainer();
    } else {
        document.body.style.overflow = 'auto';
    }
}

function switchCabinetTab(tabKey) {
    // Remove active tab menu highlight
    document.querySelectorAll('.cabinet-nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.cabinet-nav-item[data-tab="${tabKey}"]`).classList.add('active');

    // Switch pane views
    document.querySelectorAll('.cabinet-tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`tab-${tabKey}`).classList.add('active');

    currentCabinetTab = tabKey;
}

// 8.1 Homework checklist updates readiness progress bar
function toggleHomework(hwId, isChecked) {
    const hwCard = document.getElementById(hwId);
    const badge = hwCard.querySelector('.hw-status-badge');
    
    if (isChecked) {
        hwCard.classList.add('completed');
        badge.innerText = 'Выполнено';
        badge.className = 'hw-status-badge done';
    } else {
        hwCard.classList.remove('completed');
        badge.innerText = 'В процессе';
        badge.className = 'hw-status-badge pending';
    }

    updateRelocationProgress();
}

function updateRelocationProgress() {
    // Standard starting index is 46% (representing DS-160 completed)
    let totalIndex = 46;
    
    // Check if Cover Letter checked (+12%)
    if (document.getElementById('chk-hw-1').checked) {
        totalIndex += 12;
    }
    // Check if Business Idioms checked (+10%)
    if (document.getElementById('chk-hw-2').checked) {
        totalIndex += 10;
    }
    
    // Update dashboard visual circular progress
    const circle = document.getElementById('relocationProgressCircle');
    const pctText = document.getElementById('relocationProgressPct');

    if (circle && pctText) {
        pctText.innerText = `${totalIndex}%`;
        circle.style.background = `conic-gradient(var(--color-primary) ${totalIndex}%, rgba(255, 255, 255, 0.05) 0)`;
    }
}

// 8.2 countdown timer logic
function initCountdown() {
    let hours = 2;
    let minutes = 14;
    let seconds = 45;

    const display = document.getElementById('lessonCountdown');
    if (!display) return;

    setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
            if (minutes < 0) {
                minutes = 59;
                hours--;
                if (hours < 0) {
                    // Reset to fake cycle
                    hours = 2;
                    minutes = 30;
                    seconds = 0;
                }
            }
        }

        const pHours = String(hours).padStart(2, '0');
        const pMinutes = String(minutes).padStart(2, '0');
        const pSeconds = String(seconds).padStart(2, '0');
        
        display.innerText = `${pHours}ч : ${pMinutes}м : ${pSeconds}с`;
    }, 1000);
}

// 8.3 Vocabulary interactions
function initVocab() {
    renderVocabTable();
    updateCabinetWordTrainer();
}

function renderVocabTable() {
    const tableBody = document.getElementById('vocabTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    vocabList.forEach((word, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-eng">${word.eng}</td>
            <td>${word.rus}</td>
            <td><span class="tag">${word.cat}</span></td>
            <td>
                <button class="btn-delete-word" onclick="deleteWord(${index})" title="Удалить слово">
                    <i data-lucide="trash-2" class="icon-small"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update vocab tab sidebar notifications
    document.getElementById('vocabBadgeCount').innerText = vocabList.length;
    document.getElementById('totalCardsCount').innerText = vocabList.length;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function deleteWord(index) {
    if (confirm('Вы действительно хотите удалить слово из вашего словаря?')) {
        vocabList.splice(index, 1);
        renderVocabTable();
        // Adjust trainer index if it exceeds length
        if (trainerWordIndex >= vocabList.length) {
            trainerWordIndex = 0;
        }
        updateCabinetWordTrainer();
    }
}

function openAddWordModal() {
    document.getElementById('addWordModal').style.display = 'flex';
}

function closeAddWordModal() {
    document.getElementById('addWordModal').style.display = 'none';
}

function addNewWord(e) {
    e.preventDefault();
    const eng = document.getElementById('newWordEng').value;
    const rus = document.getElementById('newWordRus').value;
    const cat = document.getElementById('newWordCategory').value;

    vocabList.push({ eng, rus, cat });
    
    renderVocabTable();
    updateCabinetWordTrainer();
    closeAddWordModal();

    // Reset inputs
    document.getElementById('addWordForm').reset();
}

// 8.4 Flashcard trainer
function flipFlashcard() {
    const deck = document.getElementById('flashcardDeck');
    deck.classList.toggle('flipped');
}

function updateCabinetWordTrainer() {
    const front = document.getElementById('fcFrontWord');
    const back = document.getElementById('fcBackWord');
    const cardProgressIndex = document.getElementById('currentCardIndex');

    if (!front || vocabList.length === 0) return;

    // Reset card flip class
    document.getElementById('flashcardDeck').classList.remove('flipped');

    // Load active index values
    const currentWord = vocabList[trainerWordIndex];
    front.innerText = currentWord.eng;
    back.innerText = currentWord.rus;
    cardProgressIndex.innerText = trainerWordIndex + 1;
}

function markCardKnowledge(knows, event) {
    if (event) event.stopPropagation(); // Avoid card flipping when clicking buttons

    // Go to next card
    trainerWordIndex++;
    if (trainerWordIndex >= vocabList.length) {
        trainerWordIndex = 0; // loop back to first
        alert('Поздравляем! Вы прошли всю стопку карточек. Начинаем заново для закрепления.');
    }
    updateCabinetWordTrainer();
}

// Cabinet simulation alerts
function simulateJoinLesson() {
    alert('Инициализация сессии Zoom... \nПодключение к виртуальному классу John Davis... \nСоединение установлено! Приятного урока.');
}

function simulateReschedule() {
    const newTime = prompt('Введите удобные день и время для переноса урока (например: Пятница, 20:00):');
    if (newTime) {
        alert(`Запрос на перенос урока отправлен преподавателю John Davis. Новое время: ${newTime}. Статус подтверждения можно отслеживать в ЛК.`);
    }
}
