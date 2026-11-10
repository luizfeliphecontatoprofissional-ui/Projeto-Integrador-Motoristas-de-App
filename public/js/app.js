
/* ==========================================
   DRIVEWISE - JAVASCRIPT PRINCIPAL
   Interface multipágina
   Corridas e mapa são simulações
========================================== */


// ==========================================
// 1. CONSTANTES E FUNÇÕES AUXILIARES
// ==========================================

const $ = id => document.getElementById(id);

const brl = n => Number(n || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const today = () => {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};


// ==========================================
// 2. CONFIGURAÇÃO DO MENU
// ==========================================

const menu = [
    ['inicio', '⌂', 'Início'],
    ['corridas', '🚗', 'Corridas'],
    ['painel', '▥', 'Resumo'],
    ['relatorios', '▤', 'Relatórios'],
    ['alertas', '♧', 'Alertas'],
    ['perfil', '⚙', 'Perfil']
];

let settings = {
    daily_goal: 200,
    minimum_per_km: 1.5
};

let rideRunning = false;
let lastRide = null;
let apiAvailable = false;


// ==========================================
// 3. SEGURANÇA E FORMATAÇÃO
// ==========================================

const escapeHTML = s =>
    String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));


// ==========================================
// 4. NOTIFICAÇÕES DO SISTEMA
// ==========================================

function notify(text, error = false) {
    const n = $('toast');

    n.textContent = text;

    n.className = 'notice show' + (error ? ' error' : '');

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
        n.className = 'notice';
    }, 5000);
}


// ==========================================
// 5. COMUNICAÇÃO COM A API
// ==========================================

async function api(url, options = {}) {
    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

    } catch {
        throw Error(
            'API indisponível. Execute o servidor Node.js e o MySQL.'
        );
    }

    let data;

    try {
        data = await response.json();

    } catch {
        throw Error(
            'Resposta inválida da API. O Live Server não executa o backend.'
        );
    }

    if (!response.ok) {
        throw Error(
            data?.error || 'Falha na solicitação.'
        );
    }

    return data;
}


// ==========================================
// 6. NAVEGAÇÃO ENTRE AS PÁGINAS
// ==========================================

function go(view) {
    if (!menu.some(m => m[0] === view)) {
        view = 'inicio';
    }

    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle(
            'active',
            p.id === 'view-' + view
        );
    });

    document.querySelectorAll('[data-view]').forEach(n => {
        n.classList.toggle(
            'active',
            n.dataset.view === view
        );

        if (n.dataset.view === view) {
            n.setAttribute('aria-current', 'page');
        } else {
            n.removeAttribute('aria-current');
        }
    });

    history.replaceState(null, '', '#' + view);

    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });

    if (view === 'painel') {
        refresh();
    }

    if (view === 'relatorios') {
        reports();
    }
}


// ==========================================
// 7. CONFIGURAÇÃO DOS MENUS
// ==========================================

function setupNav() {
    for (const id of ['sideNav', 'bottomNav']) {
        $(id).innerHTML = menu.map(([v, icon, label]) =>
            `<button type="button"
                class="nav-link-item"
                data-view="${v}">
                <span class="ico">${icon}</span>
                ${label}
            </button>`
        ).join('');
    }

    document.addEventListener('click', e => {
        const target = e.target.closest(
            '[data-view],[data-go]'
        );

        if (target) {
            e.preventDefault();

            go(
                target.dataset.view ||
                target.dataset.go
            );
        }
    });

    window.addEventListener('hashchange', () => {
        go(location.hash.slice(1));
    });

    go(location.hash.slice(1) || 'inicio');
}


// ==========================================
// 8. ATUALIZAÇÃO DO DASHBOARD
// ==========================================

async function refresh() {
    if (!apiAvailable) {
        return;
    }

    try {
        const date = $('date').value;

        const [s, entries] = await Promise.all([
            api('/api/summary?date=' + encodeURIComponent(date)),
            api('/api/entries?date=' + encodeURIComponent(date))
        ]);

        // Indicadores financeiros
        for (const k of [
            'revenue',
            'expenses',
            'profit',
            'perHour'
        ]) {
            $(k).textContent = brl(s[k]);
        }

        // Progresso da meta diária
        const pct = settings.daily_goal > 0
            ? Math.max(0, s.profit / settings.daily_goal * 100)
            : 0;

        $('goalBar').style.width =
            Math.min(pct, 100) + '%';

        $('goalText').textContent =
            `${pct.toFixed(0)}% da meta • ${Number(s.km).toFixed(1)} km registrados`;

        // Limpar lançamentos anteriores
        $('entries').replaceChildren();

        if (!entries.length) {
            $('entries').innerHTML =
                '<p class="muted">Nenhum lançamento nesta data.</p>';
        }

        // Exibir lançamentos
        for (const e of entries) {
            const item = document.createElement('div');
            item.className = 'entry';

            const info = document.createElement('div');

            const b = document.createElement('b');
            b.textContent = e.kind;

            const note = document.createElement('small');
            note.textContent = e.description || '';

            info.append(b, note);

            const right = document.createElement('div');
            right.className = 'entry-right';

            const val = document.createElement('span');

            val.textContent =
                (e.kind === 'ganho' ? '+ ' : '− ') +
                brl(e.amount);

            // Botão excluir
            const del = document.createElement('button');

            del.className = 'mini-delete';
            del.textContent = 'Excluir';

            del.setAttribute(
                'aria-label',
                'Excluir lançamento'
            );

            del.onclick = async () => {
                if (!confirm('Excluir este lançamento?')) {
                    return;
                }

                try {
                    await api('/api/entries/' + e.id, {
                        method: 'DELETE'
                    });

                    await refresh();

                } catch (err) {
                    notify(err.message, true);
                }
            };

            right.append(val, del);
            item.append(info, right);

            $('entries').append(item);
        }

    } catch (e) {
        notify(e.message, true);
    }
}


// ==========================================
// 9. RELATÓRIOS FINANCEIROS
// ==========================================

async function reports() {
    if (!apiAvailable) {
        return;
    }

    try {
        const entries = await api('/api/entries');

        let revenue = 0;
        let expenses = 0;

        const by = {};

        // Calcular ganhos e despesas
        for (const e of entries) {
            if (e.kind === 'ganho') {
                revenue += Number(e.amount);

            } else {
                expenses += Number(e.amount);

                by[e.kind] =
                    (by[e.kind] || 0) + Number(e.amount);
            }
        }

        // Atualizar indicadores
        $('reportRevenue').textContent = brl(revenue);
        $('reportExpenses').textContent = brl(expenses);
        $('reportProfit').textContent = brl(revenue - expenses);
        $('reportCount').textContent = entries.length;

        // Criar gráficos
        const max = Math.max(
            ...Object.values(by),
            1
        );

        $('reportBars').replaceChildren();

        if (!Object.keys(by).length) {
            $('reportBars').innerHTML =
                '<p class="muted">Sem despesas registradas.</p>';
        }

        for (const [name, total] of Object.entries(by)) {
            const el = document.createElement('div');

            const label = document.createElement('div');
            label.className = 'bar-label';

            const title = document.createElement('span');
            title.textContent = name;

            const value = document.createElement('b');
            value.textContent = brl(total);

            label.append(title, value);

            const track = document.createElement('div');
            track.className = 'bar-track';

            const bar = document.createElement('div');

            bar.style.width =
                (total / max * 100) + '%';

            track.append(bar);
            el.append(label, track);

            $('reportBars').append(el);
        }

    } catch (e) {
        notify(e.message, true);
    }
}


// ==========================================
// 10. ALERTAS DE MANUTENÇÃO
// ==========================================

function alerts() {
    const list = JSON.parse(
        localStorage.getItem('drivewise_alerts') || '[]'
    );

    $('alertList').replaceChildren();

    if (!list.length) {
        $('alertList').innerHTML =
            '<p class="muted">Nenhum lembrete cadastrado.</p>';
    }

    list.forEach((a, i) => {
        const row = document.createElement('div');
        row.className = 'entry';

        const info = document.createElement('div');

        const name = document.createElement('b');
        name.textContent = a.type;

        const km = document.createElement('small');

        km.textContent =
            `Avisar aos ${Number(a.km).toLocaleString('pt-BR')} km`;

        info.append(name, km);

        const del = document.createElement('button');

        del.className = 'mini-delete';
        del.textContent = 'Excluir';

        del.onclick = () => {
            const data = JSON.parse(
                localStorage.getItem('drivewise_alerts') || '[]'
            );

            data.splice(i, 1);

            localStorage.setItem(
                'drivewise_alerts',
                JSON.stringify(data)
            );

            alerts();
        };

        row.append(info, del);

        $('alertList').append(row);
    });
}


// ==========================================
// 11. FORMULÁRIOS E EVENTOS
// ==========================================

function setupForms() {

    // Data atual
    $('date').value = today();

    $('date').addEventListener('change', refresh);


    // --------------------------------------
    // CALCULADORA DE CORRIDAS
    // --------------------------------------

    $('rideForm').addEventListener('submit', e => {
        e.preventDefault();

        const km = Number($('rideKm').value);
        const value = Number($('rideValue').value);
        const minutes = Number($('rideMinutes').value);

        if (km <= 0 || value < 0 || minutes <= 0) {
            return;
        }

        const per = value / km;
        const ok = per >= settings.minimum_per_km;

        lastRide = {
            km,
            value,
            minutes,
            app: $('rideApp').value
        };

        $('rideResult').className =
            'result-box' + (ok ? '' : ' bad');

        $('rideResult').textContent =
            `${ok ? '✓ Acima do mínimo' : '⚠ Abaixo do mínimo'} • ` +
            `${brl(per)}/km • ` +
            `${brl(value / minutes * 60)}/h (bruto estimado). ` +
            `Referência: ${brl(settings.minimum_per_km)}/km. ` +
            `Não considera combustível, taxas nem deslocamentos adicionais.`;
    });


    // --------------------------------------
    // INICIAR CORRIDA SIMULADA
    // --------------------------------------

    $('startRide').onclick = () => {
        if (!lastRide) {
            notify(
                'Analise uma corrida antes de iniciar.',
                true
            );

            return;
        }

        rideRunning = true;

        $('rideStatus').textContent =
            `Corrida simulada em andamento • ${lastRide.app} • ${lastRide.km} km`;

        $('startRide').disabled = true;
        $('finishRide').disabled = false;
    };


    // --------------------------------------
    // FINALIZAR CORRIDA SIMULADA
    // --------------------------------------

    $('finishRide').onclick = () => {
        rideRunning = false;

        $('rideStatus').textContent =
            'Corrida simulada finalizada. Para contabilizar o ganho, registre-o no Resumo diário.';

        $('startRide').disabled = false;
        $('finishRide').disabled = true;

        notify('Corrida simulada finalizada.');
    };


    // --------------------------------------
    // CADASTRAR ALERTAS DE MANUTENÇÃO
    // --------------------------------------

    $('alertForm').addEventListener('submit', e => {
        e.preventDefault();

        const data = JSON.parse(
            localStorage.getItem('drivewise_alerts') || '[]'
        );

        data.push({
            type: $('alertType').value,
            km: Number($('alertKm').value)
        });

        localStorage.setItem(
            'drivewise_alerts',
            JSON.stringify(data)
        );

        e.target.reset();

        alerts();

        notify('Lembrete salvo neste navegador.');
    });


    // --------------------------------------
    // REGISTRAR GANHOS E DESPESAS
    // --------------------------------------

    $('entryForm').addEventListener('submit', async e => {
        e.preventDefault();

        try {
            await api('/api/entries', {
                method: 'POST',

                body: JSON.stringify({
                    entry_date: $('date').value,
                    kind: $('kind').value,
                    amount: Number($('amount').value),
                    kilometers: Number($('km').value || 0),
                    hours_worked: Number($('hours').value || 0),
                    description: $('description').value
                })
            });

            e.target.reset();

            notify('Lançamento salvo.');

            await refresh();

        } catch (err) {
            notify(err.message, true);
        }
    });


    // --------------------------------------
    // ATUALIZAR METAS
    // --------------------------------------

    $('settingsForm').addEventListener('submit', async e => {
        e.preventDefault();

        try {
            const data = {
                daily_goal: Number($('goal').value),
                minimum_per_km: Number($('minimum').value)
            };

            await api('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            settings = data;

            notify('Metas atualizadas.');

            await refresh();

        } catch (err) {
            notify(err.message, true);
        }
    });


    // --------------------------------------
    // CADASTRAR VEÍCULO
    // --------------------------------------

    $('vehicleForm').addEventListener('submit', async e => {
        e.preventDefault();

        try {
            const data = {
                name: $('vehicleName').value,
                ownership: $('ownership').value,
                fuel_type: $('fuelType').value,
                weekly_rent: Number($('rent').value || 0)
            };

            await api('/api/vehicle', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            $('vehicleStatus').textContent =
                `Veículo atual: ${data.name} (${data.ownership})`;

            notify('Veículo salvo.');

        } catch (err) {
            notify(err.message, true);
        }
    });
}


// ==========================================
// 12. INICIALIZAÇÃO DO SISTEMA
// ==========================================

async function init() {

    // Preparar navegação
    setupNav();

    // Preparar formulários
    setupForms();

    // Carregar alertas locais
    alerts();

    try {
        // Verificar backend
        await api('/api/health');

        apiAvailable = true;

        // Carregar configurações
        settings = await api('/api/settings');

        $('goal').value = settings.daily_goal;
        $('minimum').value = settings.minimum_per_km;

        // Carregar veículo cadastrado
        const v = await api('/api/vehicle');

        if (v) {
            $('vehicleName').value = v.name;
            $('ownership').value = v.ownership;
            $('fuelType').value = v.fuel_type;
            $('rent').value = v.weekly_rent;

            $('vehicleStatus').textContent =
                `Veículo atual: ${v.name} (${v.ownership})`;
        }

        // Atualizar painel
        await refresh();

    } catch (e) {
        notify(
            'Modo visual: backend indisponível. Corridas simuladas e navegação funcionam; finanças precisam da API.',
            true
        );
    }
}


// ==========================================
// 13. EXECUTAR A APLICAÇÃO
// ==========================================

init();
