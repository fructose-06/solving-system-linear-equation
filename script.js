let currentMethod = 0;
let N = 3;

const descriptions = [
    "1.1 Inverse Matrix: หา A⁻¹ แล้วคำนวณ X = A⁻¹B",
    "1.2 Cramer's Rule: ใช้ Determinant หาคำตอบ (Dx/D, ...)",
    "1.3 Gauss Elimination: Forward Elimination -> Back Substitution",
    "1.4 Gauss-Jordan: ทำจนได้ Reduced Row Echelon Form",
    "1.5 LU Factorization: แยก A = LU แล้วแก้ Ly=B, Ux=y"
];

window.onload = () => createGrid();

function createGrid() {
    const sizeInput = document.getElementById('size-input').value;
    N = parseInt(sizeInput);
    if (N < 2) N = 2;
    if (N > 10) { alert("ขนาดใหญ่สุดคือ 10x10 เพื่อประสิทธิภาพครับ"); N = 10; }

    const container = document.getElementById('matrix-inputs');
    container.innerHTML = '';
    
    container.style.gridTemplateColumns = `repeat(${N + 1}, 1fr)`;

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N + 1; c++) {
            let inp = document.createElement('input');
            inp.id = `val-${r}-${c}`;
            inp.type = "number";
            inp.value = (c === N) ? Math.floor(Math.random()*10) : (r === c ? 3 : Math.floor(Math.random()*3));
            if (c === N) inp.classList.add('result-col');
            container.appendChild(inp);
        }
    }
    document.getElementById('output-area').innerText = `สร้าง Matrix ขนาด ${N}x${N} เรียบร้อย`;
}

function selectMethod(index) {
    currentMethod = index;
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === index));
    document.getElementById('method-desc').innerText = descriptions[index];
}

function getMatrix() {
    let mat = [];
    for(let r=0; r<N; r++){
        mat[r] = [];
        for(let c=0; c<N+1; c++) {
            mat[r][c] = parseFloat(document.getElementById(`val-${r}-${c}`).value) || 0;
        }
    }
    return mat;
}

function log(msg) {
    document.getElementById('output-area').innerText += msg + "\n";
}

function calculate() {
    document.getElementById('output-area').innerText = ""; 
    const M = getMatrix();
    
    let A = M.map(row => row.slice(0, N));
    let B = M.map(row => row[N]);

    log(`[ N=${N}, Method: ${descriptions[currentMethod].split(':')[0]} ]`);
    log("-----------------------------------------");

    try {
        switch(currentMethod) {
            case 0: methodInverse(A, B); break;
            case 1: methodCramer(A, B); break;
            case 2: methodGauss(M); break;      
            case 3: methodGaussJordan(M); break;
            case 4: methodLU(A, B); break;
        }
    } catch (e) {
        log("\n❌ Error: " + e);
    }
}

function methodInverse(A, B) {
    log("Step 1: คำนวณหา A⁻¹ (Inverse Matrix)...");
    
    let aug = [];
    for(let i=0; i<N; i++) {
        aug[i] = [...A[i]];
        for(let j=0; j<N; j++) aug[i].push(i===j ? 1 : 0);
    }

    for(let i=0; i<N; i++) {
        let pivot = aug[i][i];
        if(Math.abs(pivot) < 1e-9) throw "Pivot เป็น 0 (หา Inverse ไม่ได้)";
        for(let j=0; j<2*N; j++) aug[i][j] /= pivot;
        for(let k=0; k<N; k++) {
            if(k !== i) {
                let factor = aug[k][i];
                for(let j=0; j<2*N; j++) aug[k][j] -= factor * aug[i][j];
            }
        }
    }

    let inv = [];
    for(let i=0; i<N; i++) inv[i] = aug[i].slice(N, 2*N);
    
    log("\n   👇 หน้าตาของ Inverse Matrix (A⁻¹):");
    for(let i=0; i<N; i++) {
        let rowStr = "   | ";
        for(let j=0; j<N; j++) {
            let val = inv[i][j];
            let valStr = val.toFixed(4);
            if(val >= 0) valStr = " " + valStr; 
            rowStr += valStr + "  ";
        }
        rowStr += "|";
        log(rowStr);
    }
    log(""); 
    
    log("Step 2: คูณ Matrix X = A⁻¹ * B");
    let x = new Array(N).fill(0);
    for(let i=0; i<N; i++) {
        for(let j=0; j<N; j++) {
            x[i] += inv[i][j] * B[j];
        }
    }
    logResult(x);
}

function methodCramer(A, B) {
    let detA = getDeterminant(A);
    log(`Step 1: Det(A) = ${detA.toFixed(4)}`);
    if(Math.abs(detA) < 1e-9) throw "Det(A) = 0 หาคำตอบด้วย Cramer ไม่ได้";

    let res = [];
    for(let col=0; col<N; col++) {
        let Ai = A.map(row => [...row]);
        for(let row=0; row<N; row++) Ai[row][col] = B[row];
        
        let detAi = getDeterminant(Ai);
        log(`Step 2: Det(A${col+1}) = ${detAi.toFixed(4)}`);
        res.push(detAi / detA);
    }
    logResult(res);
}

function methodGauss(M) {
    let mat = JSON.parse(JSON.stringify(M));
    
    log("Step 1: Forward Elimination");
    for(let i=0; i<N; i++) {
        let maxRow = i;
        for(let k=i+1; k<N; k++) if(Math.abs(mat[k][i]) > Math.abs(mat[maxRow][i])) maxRow = k;
        [mat[i], mat[maxRow]] = [mat[maxRow], mat[i]];

        if(Math.abs(mat[i][i]) < 1e-9) throw "Singular Matrix (ไม่มีคำตอบเดียว)";

        for(let j=i+1; j<N; j++) {
            let factor = mat[j][i] / mat[i][i];
            for(let k=i; k<=N; k++) mat[j][k] -= factor * mat[i][k];
        }
    }

    log("Step 2: Back Substitution");
    let x = new Array(N).fill(0);
    for(let i=N-1; i>=0; i--) {
        let sum = 0;
        for(let j=i+1; j<N; j++) sum += mat[i][j] * x[j];
        x[i] = (mat[i][N] - sum) / mat[i][i];
    }
    logResult(x);
}

function methodGaussJordan(M) {
    let mat = JSON.parse(JSON.stringify(M));
    
    log("Step 1: Elimination to Reduced Row Echelon Form");
    for(let i=0; i<N; i++) {
        let maxRow = i;
        for(let k=i+1; k<N; k++) if(Math.abs(mat[k][i]) > Math.abs(mat[maxRow][i])) maxRow = k;
        [mat[i], mat[maxRow]] = [mat[maxRow], mat[i]];

        let pivot = mat[i][i];
        if(Math.abs(pivot) < 1e-9) throw "Singular Matrix";

        for(let j=i; j<=N; j++) mat[i][j] /= pivot;

        for(let k=0; k<N; k++) {
            if(k !== i) {
                let factor = mat[k][i];
                for(let j=i; j<=N; j++) mat[k][j] -= factor * mat[i][j];
            }
        }
    }
    
    let x = [];
    for(let i=0; i<N; i++) x.push(mat[i][N]);
    logResult(x);
}

function methodLU(A, B) {
    log("Step 1: แยก L และ U");
    let L = Array.from({length: N}, () => Array(N).fill(0));
    let U = Array.from({length: N}, () => Array(N).fill(0));

    for(let i=0; i<N; i++) {
        for(let k=i; k<N; k++) {
            let sum = 0;
            for(let j=0; j<i; j++) sum += (L[i][j] * U[j][k]);
            U[i][k] = A[i][k] - sum;
        }
        for(let k=i; k<N; k++) {
            if (i === k) L[i][i] = 1;
            else {
                let sum = 0;
                for(let j=0; j<i; j++) sum += (L[k][j] * U[j][i]);
                L[k][i] = (A[k][i] - sum) / U[i][i];
            }
        }
    }

    log("Step 2: Solve Ly = B");
    let y = new Array(N).fill(0);
    for(let i=0; i<N; i++) {
        let sum = 0;
        for(let j=0; j<i; j++) sum += L[i][j] * y[j];
        y[i] = (B[i] - sum);
    }

    log("Step 3: Solve Ux = y");
    let x = new Array(N).fill(0);
    for(let i=N-1; i>=0; i--) {
        let sum = 0;
        for(let j=i+1; j<N; j++) sum += U[i][j] * x[j];
        x[i] = (y[i] - sum) / U[i][i];
    }
    logResult(x);
}

function getDeterminant(matrix) {
    let m = matrix.map(row => [...row]);
    let n = m.length;
    let det = 1;

    for (let i = 0; i < n; i++) {
        let pivot = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
        }
        if(pivot !== i) {
            [m[i], m[pivot]] = [m[pivot], m[i]];
            det *= -1; 
        }
        if (Math.abs(m[i][i]) < 1e-9) return 0;

        det *= m[i][i];
        
        for (let j = i + 1; j < n; j++) {
            let factor = m[j][i] / m[i][i];
            for (let k = i + 1; k < n; k++) m[j][k] -= factor * m[i][k];
        }
    }
    return det;
}

function logResult(res) {
    log("\n>> คำตอบ (Solutions):");
    res.forEach((val, i) => {
        log(`   x${i+1} = ${val.toFixed(4)}`);
    });
}
