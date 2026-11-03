// "Bản đồ toàn môn": the 7 lessons of the course, checked against the lecturer's slides (Bài 1–7, HK1 2026–2027).
// Notation follows the slides: P(A/B), P(A.B), P(A+B); Φ is the Laplace function Φ(x) = P{0 ≤ X ≤ x}.
// String.raw keeps LaTeX backslashes as written (no "${" anywhere in the text).
export const COURSE = String.raw`# Xác suất và Thống kê
## Bài 1: Xác suất và công thức tính xác suất
### 1. Khái niệm cơ bản
#### 1.1. Xác suất là gì?
- Tỉ lệ dự đoán về một hiện tượng mà chưa biết trước kết quả xảy ra như thế nào
#### 1.2. Các khái niệm liên quan
- Phép thử: hành động mà kết quả không biết chắc trước
- Biến cố chắc chắn $\Omega$
- Biến cố không thể $\varnothing$
- Biến cố ngẫu nhiên
- Biến cố đối $\overline{A}$: $A+\overline{A}=\Omega$, $A.\overline{A}=\varnothing$
#### 1.3. Định nghĩa xác suất
- Cổ điển
- Theo thống kê
### 2. Các công thức cơ bản
#### 2.1. Công thức cộng
- $P(A+B)=P(A)+P(B)-P(AB)$
- Xung khắc: $P(A+B)=P(A)+P(B)$
- $P(\overline{A})=1-P(A)$
#### 2.2. Xác suất có điều kiện
- $P(A.B)=\frac{k}{n}$, $P(B)=\frac{m}{n}$, $P(A/B)=\frac{k}{m}$
- $P(A/B)=\frac{P(A.B)}{P(B)}$
- Công thức nhân: $P(A.B)=P(A).P(B/A)=P(B).P(A/B)$
- Độc lập: $P(A.B)=P(A).P(B)$
#### 2.3. Công thức Bernoulli
- $P_n(x)=C_n^x\,p^x q^{n-x}$, $q=1-p$
#### 2.4. Xác suất đầy đủ và Bayes
- Nhóm đầy đủ $\{H_1, H_2, \dots, H_n\}$
- $P(A)=P(H_1).P(A/H_1)+\dots+P(H_n).P(A/H_n)$
- $P(H_i/A)=\frac{P(H_i.A)}{P(A)}$
### 3. Ghi chú kí hiệu
- $\Omega$: biến cố chắc chắn
- $\varnothing$: biến cố không thể
- $P(B)$: xác suất của biến cố B
## Bài 2: Biến ngẫu nhiên
### 1. Khái niệm
- Quy tắc gán mỗi biến cố sơ cấp với một số thực; kí hiệu $X, Y, Z$
- Rời rạc: nhận hữu hạn hoặc đếm được vô hạn giá trị
- Liên tục: nhận mọi giá trị trong một khoảng
### 2. Luật phân phối xác suất
#### 2.1. Rời rạc: bảng phân phối
- Bảng giá trị $x_i$ và xác suất $p_i$
#### 2.2. Liên tục: hàm mật độ $f(x)$
- $f(x)\ge 0,\ \forall x\in\mathbb{R}$
- $\int_{-\infty}^{+\infty} f(x)\,dx=1$
- $P\{a\le X\le b\}=\int_a^b f(x)\,dx$
### 3. Các đặc trưng số
#### 3.1. Mode X
- Rời rạc: giá trị có xác suất lớn nhất
- Liên tục: giá trị làm hàm mật độ lớn nhất
#### 3.2. Kì vọng $E_X$
- Rời rạc: $E_X=\sum x_i p_i$
- Liên tục: $E_X=\int_{-\infty}^{+\infty} x f(x)\,dx$
- $E(C)=C$, $E(C.X)=C.E_X$
- $E(X+Y)=E_X+E_Y$
- X, Y độc lập: $E(X.Y)=E_X.E_Y$
#### 3.3. Phương sai $Var(X)$
- $Var(X)=E[(X-E(X))^2]=E(X^2)-[E(X)]^2$
- Trong tính toán: $V_X=E_{X^2}-(E_X)^2$
- Độ lệch tiêu chuẩn: $\sigma=\sqrt{V_X}$
- $V(C)=0$, $V(CX)=C^2V(X)$; X, Y độc lập: $V(X+Y)=V_X+V_Y$
## Bài 3: Một số phân phối thông dụng
### 1. Khái niệm
- Mô tả xác suất của các biến ngẫu nhiên thường xuất hiện trong thực tế
### 2. Phân phối chuẩn
#### 2.1. Định nghĩa
- $X\sim N(\mu;\sigma^2)$, $f(x)=\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$
- $E(X)=\mu$, $V(X)=\sigma^2$
#### 2.2. Phân phối chuẩn tắc
- $\mu=0$, $\sigma=1$: $f(x)=\frac{1}{\sqrt{2\pi}}e^{-\frac{x^2}{2}}$
- $\Phi(x)=P\{0\le X\le x\}=\frac{1}{\sqrt{2\pi}}\int_0^x e^{-\frac{t^2}{2}}dt$
- $P\{a<X<b\}=\Phi(b)-\Phi(a)$
- $\Phi(-x)=-\Phi(x)$; $x>5$: $\Phi(x)\approx 0{,}5$
#### 2.2.1. Định lí
- $Z=\frac{X-\mu}{\sigma}\sim N(0;1)$
#### 2.2.2. Cách tính
- $P(a<X<b)=\Phi\left(\frac{b-\mu}{\sigma}\right)-\Phi\left(\frac{a-\mu}{\sigma}\right)$
### 3. Phân phối Poisson
- $X\sim P(\lambda)$: $P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!}$, $k=0,1,2,\dots$
- $\lambda$: số lần xuất hiện trung bình trong khoảng đang xét
- $E(X)=\lambda$, $Var(X)=\lambda$
### 4. Phân phối nhị thức
- $X\sim B(n,p)$: $P(X=k)=C_n^k p^k q^{n-k}$, $q=1-p$
#### 4.1. Đặc trưng
- $E(X)=np$, $Var(X)=npq$
- Mod: $np-q\le k_0\le np-q+1$
#### 4.2. Xấp xỉ bằng Poisson
- $n\to\infty$, $p\to 0$, đặt $\lambda=np$
#### 4.3. Điều kiện áp dụng
- $n\ge 50$; $p\le 0{,}1$
- Lí tưởng nhất khi $\lambda=np\le 5$
#### 4.4. Xấp xỉ bằng phân phối chuẩn
- Tốt khi $np\ge 5$ và $nq\ge 5$ (cao hơn: $\ge 10$)
- $X\sim B(n,p)\approx N(np,npq)$
- $P\{k_1\le X\le k_2\}\approx\Phi\left(\frac{k_2-np}{\sqrt{npq}}\right)-\Phi\left(\frac{k_1-np}{\sqrt{npq}}\right)$
### 5. Các phân phối khác (đọc thêm)
- Đều, mũ, khi bình phương, Student, Fisher – Snedecor
## Bài 4: Mẫu ngẫu nhiên và các số đặc trưng của mẫu
### 1. Khái niệm về mẫu
- Tập con các phần tử chọn ra từ tổng thể để quan sát, đo lường
- Mẫu ngẫu nhiên $(X_1; X_2; \dots; X_n)$
- Mẫu cụ thể: giá trị cụ thể của mẫu ngẫu nhiên (số liệu khảo sát)
- $X_i$ có cùng luật phân phối với tổng thể X
### 2. Đặc trưng của mẫu
#### 2.1. Đặc trưng tổng thể
- Trung bình $\mu$, tỉ lệ $p$, phương sai $\sigma^2$
#### 2.2. Mẫu ngẫu nhiên
- $\overline{X}=\frac{X_1+\dots+X_n}{n}$, $F=\frac{X_1+\dots+X_n}{n}$
- $\hat{S}^2=\frac{1}{n}\sum(X_i-\overline{X})^2$
- Hiệu chỉnh: $S^2=\frac{1}{n-1}\sum(X_i-\overline{X})^2$
#### 2.3. Mẫu cụ thể
- $\bar{x}=\frac{x_1+\dots+x_n}{n}$, $f=\frac{x_1+\dots+x_n}{n}$
- $\hat{s}^2=\frac{1}{n}\sum(x_i-\bar{x})^2$
- Hiệu chỉnh: $s^2=\frac{1}{n-1}\sum(x_i-\bar{x})^2$
#### 2.4. Bảng giá trị và tần số
- $\bar{x}=\frac{n_1x_1+\dots+n_kx_k}{n}$, $n=\sum n_i$
- $\hat{s}^2=\frac{1}{n}\sum n_i(x_i-\bar{x})^2$, $s^2=\frac{1}{n-1}\sum n_i(x_i-\bar{x})^2$
### 3. Phân phối của các đặc trưng mẫu
#### Định lí giới hạn trung tâm
- $X_1, \dots, X_n$ độc lập, cùng phân phối, $E(X)=\mu$, $Var(X)=\sigma^2$
- n lớn: $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$; thực tế $n\ge 30$ là đủ
#### 3.1. Tỉ lệ mẫu
- $E(X)=p$, $Var(X)=\frac{pq}{n}$
- $n\ge 30$: $F\sim N\left(p,\frac{pq}{n}\right)$
#### 3.2. Trung bình mẫu
- $n\ge 30$, $\sigma^2$ đã biết (chưa biết thay bằng $S^2$): $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$
- $n<30$, $\sigma^2$ đã biết, X chuẩn: $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$
- $n<30$, $\sigma^2$ chưa biết: $T=\frac{\overline{X}-\mu}{S/\sqrt{n}}\sim T(n-1)$
#### 3.3. Phương sai mẫu ($X\sim N(\mu,\sigma^2)$)
- μ đã biết: $\frac{1}{\sigma^2}\sum(X_i-\mu)^2\sim\chi^2(n)$
- μ chưa biết: $\frac{(n-1)S^2}{\sigma^2}=\frac{1}{\sigma^2}\sum(X_i-\overline{X})^2\sim\chi^2(n-1)$
## Bài 5: Ước lượng khoảng
### 1. Khái niệm
- $P(\theta_1<\theta<\theta_2)=1-\alpha$ (thường 90%; 95%; 99%)
- $(\theta_1,\theta_2)$: khoảng tin cậy; $1-\alpha$: độ tin cậy
- $\varepsilon=\frac{\theta_2-\theta_1}{2}$: độ chính xác
### 2. Khoảng ước lượng của tỉ lệ
- $P(A)=p$ chưa biết, căn cứ vào mẫu khảo sát kích thước n để đưa ra khoảng ước lượng cho p
- $P\{-z_{\alpha/2}\le X\le z_{\alpha/2}\}=1-\alpha\Leftrightarrow 2\Phi(z_{\alpha/2})=1-\alpha\Leftrightarrow\Phi(z_{\alpha/2})=\frac{1-\alpha}{2}=0{,}5-\frac{\alpha}{2}$
- $z_{\alpha/2}$: 90% → 1,65; 95% → 1,96; 99% → 2,58
- $n\ge 30$: $F\sim N\left(p,\frac{pq}{n}\right)$, xấp xỉ $p\approx f$, $q\approx 1-f$
- $\varepsilon=z_{\alpha/2}\sqrt{\frac{f(1-f)}{n}}$; khoảng $(f-\varepsilon;\ f+\varepsilon)$
### 3. Khoảng ước lượng của trung bình
- $n\ge 30$ hoặc ($n<30$ và $\sigma^2$ đã biết): $\varepsilon=z_{\alpha/2}\frac{\sigma}{\sqrt{n}}$ (chưa biết $\sigma$ thay bằng s)
- $n<30$, $\sigma^2$ chưa biết: $T=\frac{\overline{X}-\mu}{S/\sqrt{n}}\sim T(n-1)$, $\varepsilon=t_{\alpha/2}(n-1)\frac{s}{\sqrt{n}}$
- Khoảng: $(\bar{x}-\varepsilon;\ \bar{x}+\varepsilon)$
### 4. Khoảng ước lượng của phương sai
- Tổng thể $N(\mu,\sigma^2)$, μ chưa biết: $\frac{(n-1)S^2}{\sigma^2}\sim\chi^2(n-1)$
- Khoảng: $\left(\frac{(n-1)s^2}{\chi^2_{\alpha/2}(n-1)};\ \frac{(n-1)s^2}{\chi^2_{1-\alpha/2}(n-1)}\right)$
### Ghi chú
- $z_{\alpha/2}$: phân vị chuẩn tắc; $t_{\alpha/2}(n-1)$: phân vị Student bậc $n-1$
- $s^2=\frac{1}{n-1}\sum(x_i-\bar{x})^2$: phương sai mẫu hiệu chỉnh
## Bài 6: Kiểm định giả thiết
### 1. Nguyên lí chung
- Bước 1: lập giả thiết $H_0:\theta=\theta_0$ và đối thiết $H_1$: $\theta\ne\theta_0$, $\theta>\theta_0$ hoặc $\theta<\theta_0$
- Bước 2: dựa vào mức ý nghĩa α, đưa ra miền bác bỏ W
- Bước 3: từ mẫu cụ thể tính tiêu chuẩn kiểm định $Z_{qs}$
- Bước 4: kết luận
### 2. Kiểm định tỉ lệ
- $Z_{qs}=\frac{f-p_0}{\sqrt{p_0q_0/n}}$, $q_0=1-p_0$
- 2 phía: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- Lớn hơn: $W=(z_\alpha;+\infty)$
- Bé hơn: $W=(-\infty;-z_\alpha)$
### 3. Kiểm định trung bình
#### a. Phân phối chuẩn
- $Z_{qs}=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}$
- $H_1:\mu\ne\mu_0$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- $H_1:\mu>\mu_0$: $W=(z_\alpha;+\infty)$
- $H_1:\mu<\mu_0$: $W=(-\infty;-z_\alpha)$
#### b. Student bậc n−1 ($n<30$, $\sigma^2$ chưa biết)
- $T=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}$
- Thay $z_{\alpha/2}$ bởi $t_{\alpha/2}(n-1)$ và $z_\alpha$ bởi $t_\alpha(n-1)$
### 4. Kiểm định phương sai
#### a. μ đã biết
- $Z_{qs}=\frac{\sum(x_i-\mu)^2}{\sigma_0^2}$
- $\ne$: $W=(-\infty;\chi^2_{1-\alpha/2}(n))\cup(\chi^2_{\alpha/2}(n);+\infty)$
- $>$: $W=(\chi^2_\alpha(n);+\infty)$; $<$: $W=(-\infty;\chi^2_{1-\alpha}(n))$
#### b. μ chưa biết
- $Z_{qs}=\frac{(n-1)s^2}{\sigma_0^2}$
- $\ne$: $W=(-\infty;\chi^2_{1-\alpha/2}(n-1))\cup(\chi^2_{\alpha/2}(n-1);+\infty)$
- $>$: $W=(\chi^2_\alpha(n-1);+\infty)$; $<$: $W=(-\infty;\chi^2_{1-\alpha}(n-1))$
## Bài 7: So sánh 2 tham số
### 1. So sánh 2 tỉ lệ
- Mẫu X: kích thước n, tỉ lệ $f_1=\frac{k_1}{n}$; mẫu Y: kích thước m, $f_2=\frac{k_2}{m}$
- $H_0: p_1=p_2$ (thay giả thiết kiểm định $H_0: p_1=p_2$ vào tiêu chuẩn)
- $Z_{qs}=\frac{f_1-f_2}{\sqrt{f(1-f)\left(\frac{1}{n}+\frac{1}{m}\right)}}$, $f=\frac{k_1+k_2}{n+m}$
- $p_1\ne p_2$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- $p_1>p_2$: $W=(z_\alpha;+\infty)$; $p_1<p_2$: $W=(-\infty;-z_\alpha)$
### 2. So sánh 2 trung bình
#### a. Phân phối chuẩn
- $Z_{qs}=\frac{\bar{x}-\bar{y}}{\sqrt{\frac{\sigma_1^2}{n}+\frac{\sigma_2^2}{m}}}$
- Chưa biết phương sai: $\sigma_1^2\approx s_1^2$, $\sigma_2^2\approx s_2^2$
- $\ne$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$; $>$: $(z_\alpha;+\infty)$; $<$: $(-\infty;-z_\alpha)$
#### b. Phân phối Student
- $Z_{qs}=\frac{\bar{x}-\bar{y}}{\sqrt{s^2\left(\frac{1}{n}+\frac{1}{m}\right)}}$, $s^2=\frac{(n-1)s_1^2+(m-1)s_2^2}{n+m-2}$
- Thay $z_{\alpha/2}$ bởi $t_{\alpha/2}(m+n-2)$ và $z_\alpha$ bởi $t_\alpha(m+n-2)$
### 3. So sánh 2 phương sai
- $X\sim N(\mu_1;\sigma_1^2)$, $Y\sim N(\mu_2;\sigma_2^2)$; giả thiết $H_0:\sigma_1^2=\sigma_2^2$
- Luôn đặt $s_1^2>s_2^2$: $Z_{qs}=\frac{s_1^2}{s_2^2}=\frac{s_{max}^2}{s_{min}^2}\ge 1$
- Fisher: $P\{F_{1-\alpha/2}(n-1;m-1)\le X\le F_{\alpha/2}(n-1;m-1)\}=1-\alpha$
- $\sigma_1^2\ne\sigma_2^2$: $W=(-\infty;F_{1-\alpha/2}(n-1;m-1))\cup(F_{\alpha/2}(n-1;m-1);+\infty)$
- $\sigma_1^2>\sigma_2^2$: $W=(F_\alpha(n-1;m-1);+\infty)$
- $\sigma_1^2<\sigma_2^2$: $W=(-\infty;F_\alpha(n-1;m-1))$`;

// The same map in English, line for line: every heading level and every formula is identical to COURSE
// (tests/client.test.mjs checks this); only the words are translated.
export const COURSE_EN = String.raw`# Probability and Statistics
## Lesson 1: Probability and probability formulas
### 1. Basic concepts
#### 1.1. What is probability?
- A measure of how likely an event is when its outcome is not known in advance
#### 1.2. Related concepts
- Trial: an action whose outcome is not known for certain in advance
- Sure event $\Omega$
- Impossible event $\varnothing$
- Random event
- Complementary event $\overline{A}$: $A+\overline{A}=\Omega$, $A.\overline{A}=\varnothing$
#### 1.3. Definitions of probability
- Classical
- Statistical
### 2. Basic formulas
#### 2.1. Addition rule
- $P(A+B)=P(A)+P(B)-P(AB)$
- Mutually exclusive: $P(A+B)=P(A)+P(B)$
- $P(\overline{A})=1-P(A)$
#### 2.2. Conditional probability
- $P(A.B)=\frac{k}{n}$, $P(B)=\frac{m}{n}$, $P(A/B)=\frac{k}{m}$
- $P(A/B)=\frac{P(A.B)}{P(B)}$
- Multiplication rule: $P(A.B)=P(A).P(B/A)=P(B).P(A/B)$
- Independent: $P(A.B)=P(A).P(B)$
#### 2.3. Bernoulli formula
- $P_n(x)=C_n^x\,p^x q^{n-x}$, $q=1-p$
#### 2.4. Total probability and Bayes
- Complete group $\{H_1, H_2, \dots, H_n\}$
- $P(A)=P(H_1).P(A/H_1)+\dots+P(H_n).P(A/H_n)$
- $P(H_i/A)=\frac{P(H_i.A)}{P(A)}$
### 3. Notation
- $\Omega$: sure event
- $\varnothing$: impossible event
- $P(B)$: probability of event B
## Lesson 2: Random variables
### 1. Concept
- A rule assigning a real number to each elementary event; written $X, Y, Z$
- Discrete: takes finitely or countably infinitely many values
- Continuous: takes every value in an interval
### 2. Probability distribution
#### 2.1. Discrete: distribution table
- Table of values $x_i$ and probabilities $p_i$
#### 2.2. Continuous: density function $f(x)$
- $f(x)\ge 0,\ \forall x\in\mathbb{R}$
- $\int_{-\infty}^{+\infty} f(x)\,dx=1$
- $P\{a\le X\le b\}=\int_a^b f(x)\,dx$
### 3. Numerical characteristics
#### 3.1. Mode X
- Discrete: the value with the largest probability
- Continuous: the value where the density is largest
#### 3.2. Expected value $E_X$
- Discrete: $E_X=\sum x_i p_i$
- Continuous: $E_X=\int_{-\infty}^{+\infty} x f(x)\,dx$
- $E(C)=C$, $E(C.X)=C.E_X$
- $E(X+Y)=E_X+E_Y$
- X, Y independent: $E(X.Y)=E_X.E_Y$
#### 3.3. Variance $Var(X)$
- $Var(X)=E[(X-E(X))^2]=E(X^2)-[E(X)]^2$
- In calculations: $V_X=E_{X^2}-(E_X)^2$
- Standard deviation: $\sigma=\sqrt{V_X}$
- $V(C)=0$, $V(CX)=C^2V(X)$; X, Y independent: $V(X+Y)=V_X+V_Y$
## Lesson 3: Common distributions
### 1. Concept
- Describe the probabilities of random variables that often occur in practice
### 2. Normal distribution
#### 2.1. Definition
- $X\sim N(\mu;\sigma^2)$, $f(x)=\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$
- $E(X)=\mu$, $V(X)=\sigma^2$
#### 2.2. Standard normal distribution
- $\mu=0$, $\sigma=1$: $f(x)=\frac{1}{\sqrt{2\pi}}e^{-\frac{x^2}{2}}$
- $\Phi(x)=P\{0\le X\le x\}=\frac{1}{\sqrt{2\pi}}\int_0^x e^{-\frac{t^2}{2}}dt$
- $P\{a<X<b\}=\Phi(b)-\Phi(a)$
- $\Phi(-x)=-\Phi(x)$; $x>5$: $\Phi(x)\approx 0{,}5$
#### 2.2.1. Theorem
- $Z=\frac{X-\mu}{\sigma}\sim N(0;1)$
#### 2.2.2. How to compute
- $P(a<X<b)=\Phi\left(\frac{b-\mu}{\sigma}\right)-\Phi\left(\frac{a-\mu}{\sigma}\right)$
### 3. Poisson distribution
- $X\sim P(\lambda)$: $P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!}$, $k=0,1,2,\dots$
- $\lambda$: average number of occurrences in the interval considered
- $E(X)=\lambda$, $Var(X)=\lambda$
### 4. Binomial distribution
- $X\sim B(n,p)$: $P(X=k)=C_n^k p^k q^{n-k}$, $q=1-p$
#### 4.1. Characteristics
- $E(X)=np$, $Var(X)=npq$
- Mode: $np-q\le k_0\le np-q+1$
#### 4.2. Poisson approximation
- $n\to\infty$, $p\to 0$, set $\lambda=np$
#### 4.3. When to use it
- $n\ge 50$; $p\le 0{,}1$
- Best when $\lambda=np\le 5$
#### 4.4. Normal approximation
- Good when $np\ge 5$ and $nq\ge 5$ (stricter: $\ge 10$)
- $X\sim B(n,p)\approx N(np,npq)$
- $P\{k_1\le X\le k_2\}\approx\Phi\left(\frac{k_2-np}{\sqrt{npq}}\right)-\Phi\left(\frac{k_1-np}{\sqrt{npq}}\right)$
### 5. Other distributions (further reading)
- Uniform, exponential, chi-squared, Student, Fisher – Snedecor
## Lesson 4: Random samples and sample characteristics
### 1. Samples
- A subset of elements chosen from the population to observe and measure
- Random sample $(X_1; X_2; \dots; X_n)$
- Observed sample: the actual values of a random sample (survey data)
- Each $X_i$ has the same distribution as the population X
### 2. Sample characteristics
#### 2.1. Population characteristics
- Mean $\mu$, proportion $p$, variance $\sigma^2$
#### 2.2. Random sample
- $\overline{X}=\frac{X_1+\dots+X_n}{n}$, $F=\frac{X_1+\dots+X_n}{n}$
- $\hat{S}^2=\frac{1}{n}\sum(X_i-\overline{X})^2$
- Corrected: $S^2=\frac{1}{n-1}\sum(X_i-\overline{X})^2$
#### 2.3. Observed sample
- $\bar{x}=\frac{x_1+\dots+x_n}{n}$, $f=\frac{x_1+\dots+x_n}{n}$
- $\hat{s}^2=\frac{1}{n}\sum(x_i-\bar{x})^2$
- Corrected: $s^2=\frac{1}{n-1}\sum(x_i-\bar{x})^2$
#### 2.4. Table of values and frequencies
- $\bar{x}=\frac{n_1x_1+\dots+n_kx_k}{n}$, $n=\sum n_i$
- $\hat{s}^2=\frac{1}{n}\sum n_i(x_i-\bar{x})^2$, $s^2=\frac{1}{n-1}\sum n_i(x_i-\bar{x})^2$
### 3. Distributions of sample characteristics
#### Central limit theorem
- $X_1, \dots, X_n$ independent, identically distributed, $E(X)=\mu$, $Var(X)=\sigma^2$
- Large n: $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$; in practice $n\ge 30$ is enough
#### 3.1. Sample proportion
- $E(X)=p$, $Var(X)=\frac{pq}{n}$
- $n\ge 30$: $F\sim N\left(p,\frac{pq}{n}\right)$
#### 3.2. Sample mean
- $n\ge 30$, $\sigma^2$ known (if unknown, use $S^2$): $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$
- $n<30$, $\sigma^2$ known, X normal: $\overline{X}\sim N\left(\mu,\frac{\sigma^2}{n}\right)$
- $n<30$, $\sigma^2$ unknown: $T=\frac{\overline{X}-\mu}{S/\sqrt{n}}\sim T(n-1)$
#### 3.3. Sample variance ($X\sim N(\mu,\sigma^2)$)
- μ known: $\frac{1}{\sigma^2}\sum(X_i-\mu)^2\sim\chi^2(n)$
- μ unknown: $\frac{(n-1)S^2}{\sigma^2}=\frac{1}{\sigma^2}\sum(X_i-\overline{X})^2\sim\chi^2(n-1)$
## Lesson 5: Interval estimation
### 1. Concept
- $P(\theta_1<\theta<\theta_2)=1-\alpha$ (usually 90%; 95%; 99%)
- $(\theta_1,\theta_2)$: confidence interval; $1-\alpha$: confidence level
- $\varepsilon=\frac{\theta_2-\theta_1}{2}$: margin of error
### 2. Confidence interval for a proportion
- $P(A)=p$ unknown: from a survey sample of size n, give an interval estimate for p
- $P\{-z_{\alpha/2}\le X\le z_{\alpha/2}\}=1-\alpha\Leftrightarrow 2\Phi(z_{\alpha/2})=1-\alpha\Leftrightarrow\Phi(z_{\alpha/2})=\frac{1-\alpha}{2}=0{,}5-\frac{\alpha}{2}$
- $z_{\alpha/2}$: 90% → 1.65; 95% → 1.96; 99% → 2.58
- $n\ge 30$: $F\sim N\left(p,\frac{pq}{n}\right)$, approximately $p\approx f$, $q\approx 1-f$
- $\varepsilon=z_{\alpha/2}\sqrt{\frac{f(1-f)}{n}}$; interval $(f-\varepsilon;\ f+\varepsilon)$
### 3. Confidence interval for a mean
- $n\ge 30$ or ($n<30$ and $\sigma^2$ known): $\varepsilon=z_{\alpha/2}\frac{\sigma}{\sqrt{n}}$ (if $\sigma$ is unknown, use s)
- $n<30$, $\sigma^2$ unknown: $T=\frac{\overline{X}-\mu}{S/\sqrt{n}}\sim T(n-1)$, $\varepsilon=t_{\alpha/2}(n-1)\frac{s}{\sqrt{n}}$
- Interval: $(\bar{x}-\varepsilon;\ \bar{x}+\varepsilon)$
### 4. Confidence interval for a variance
- Population $N(\mu,\sigma^2)$, μ unknown: $\frac{(n-1)S^2}{\sigma^2}\sim\chi^2(n-1)$
- Interval: $\left(\frac{(n-1)s^2}{\chi^2_{\alpha/2}(n-1)};\ \frac{(n-1)s^2}{\chi^2_{1-\alpha/2}(n-1)}\right)$
### Notes
- $z_{\alpha/2}$: standard normal quantile; $t_{\alpha/2}(n-1)$: Student quantile with $n-1$ degrees of freedom
- $s^2=\frac{1}{n-1}\sum(x_i-\bar{x})^2$: corrected sample variance
## Lesson 6: Hypothesis testing
### 1. General principle
- Step 1: state the hypothesis $H_0:\theta=\theta_0$ and the alternative $H_1$: $\theta\ne\theta_0$, $\theta>\theta_0$ or $\theta<\theta_0$
- Step 2: from the significance level α, give the rejection region W
- Step 3: compute the test statistic $Z_{qs}$ from the observed sample
- Step 4: conclude
### 2. Testing a proportion
- $Z_{qs}=\frac{f-p_0}{\sqrt{p_0q_0/n}}$, $q_0=1-p_0$
- Two-sided: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- Greater than: $W=(z_\alpha;+\infty)$
- Less than: $W=(-\infty;-z_\alpha)$
### 3. Testing a mean
#### a. Normal distribution
- $Z_{qs}=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}$
- $H_1:\mu\ne\mu_0$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- $H_1:\mu>\mu_0$: $W=(z_\alpha;+\infty)$
- $H_1:\mu<\mu_0$: $W=(-\infty;-z_\alpha)$
#### b. Student with n−1 degrees of freedom ($n<30$, $\sigma^2$ unknown)
- $T=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}$
- Replace $z_{\alpha/2}$ with $t_{\alpha/2}(n-1)$ and $z_\alpha$ with $t_\alpha(n-1)$
### 4. Testing a variance
#### a. μ known
- $Z_{qs}=\frac{\sum(x_i-\mu)^2}{\sigma_0^2}$
- $\ne$: $W=(-\infty;\chi^2_{1-\alpha/2}(n))\cup(\chi^2_{\alpha/2}(n);+\infty)$
- $>$: $W=(\chi^2_\alpha(n);+\infty)$; $<$: $W=(-\infty;\chi^2_{1-\alpha}(n))$
#### b. μ unknown
- $Z_{qs}=\frac{(n-1)s^2}{\sigma_0^2}$
- $\ne$: $W=(-\infty;\chi^2_{1-\alpha/2}(n-1))\cup(\chi^2_{\alpha/2}(n-1);+\infty)$
- $>$: $W=(\chi^2_\alpha(n-1);+\infty)$; $<$: $W=(-\infty;\chi^2_{1-\alpha}(n-1))$
## Lesson 7: Comparing two parameters
### 1. Comparing two proportions
- Sample X: size n, proportion $f_1=\frac{k_1}{n}$; sample Y: size m, $f_2=\frac{k_2}{m}$
- $H_0: p_1=p_2$ (substitute the hypothesis $H_0: p_1=p_2$ into the statistic)
- $Z_{qs}=\frac{f_1-f_2}{\sqrt{f(1-f)\left(\frac{1}{n}+\frac{1}{m}\right)}}$, $f=\frac{k_1+k_2}{n+m}$
- $p_1\ne p_2$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$
- $p_1>p_2$: $W=(z_\alpha;+\infty)$; $p_1<p_2$: $W=(-\infty;-z_\alpha)$
### 2. Comparing two means
#### a. Normal distribution
- $Z_{qs}=\frac{\bar{x}-\bar{y}}{\sqrt{\frac{\sigma_1^2}{n}+\frac{\sigma_2^2}{m}}}$
- Unknown variances: $\sigma_1^2\approx s_1^2$, $\sigma_2^2\approx s_2^2$
- $\ne$: $W=(-\infty;-z_{\alpha/2})\cup(z_{\alpha/2};+\infty)$; $>$: $(z_\alpha;+\infty)$; $<$: $(-\infty;-z_\alpha)$
#### b. Student distribution
- $Z_{qs}=\frac{\bar{x}-\bar{y}}{\sqrt{s^2\left(\frac{1}{n}+\frac{1}{m}\right)}}$, $s^2=\frac{(n-1)s_1^2+(m-1)s_2^2}{n+m-2}$
- Replace $z_{\alpha/2}$ with $t_{\alpha/2}(m+n-2)$ and $z_\alpha$ with $t_\alpha(m+n-2)$
### 3. Comparing two variances
- $X\sim N(\mu_1;\sigma_1^2)$, $Y\sim N(\mu_2;\sigma_2^2)$; hypothesis $H_0:\sigma_1^2=\sigma_2^2$
- Always take $s_1^2>s_2^2$: $Z_{qs}=\frac{s_1^2}{s_2^2}=\frac{s_{max}^2}{s_{min}^2}\ge 1$
- Fisher: $P\{F_{1-\alpha/2}(n-1;m-1)\le X\le F_{\alpha/2}(n-1;m-1)\}=1-\alpha$
- $\sigma_1^2\ne\sigma_2^2$: $W=(-\infty;F_{1-\alpha/2}(n-1;m-1))\cup(F_{\alpha/2}(n-1;m-1);+\infty)$
- $\sigma_1^2>\sigma_2^2$: $W=(F_\alpha(n-1;m-1);+\infty)$
- $\sigma_1^2<\sigma_2^2$: $W=(-\infty;F_\alpha(n-1;m-1))$`;
