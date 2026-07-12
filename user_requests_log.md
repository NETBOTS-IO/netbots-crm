# CRM Lead Concurrency & Filters - User Problems & Requests Log



### 2. Lead Concurrency Lock (Prompt / Req 2)
*   **Aapka Prompt**: Lead table mein button ho jis par likha ho "I am working on this". Jab tak koi verifier ya closer use claim karke rakhe, koi aur verifier ya closer us par action na le sake, aur filters add hon verifiers aur closers ke.
*   **Problem / Issue**: Ek hi time par ek lead par multiple verifiers ya closers kaam kar rahe thay jisse duplicate efforts hote thay, data overwrites ho jate thay, aur crm par confusion create ho rahi thi.

---

### 3. Lead Form Update & Access Restriction (Prompt / Req 3)
*   **Aapka Prompt**: Lead form mein updates save nahi ho rahi hain aur toaster warning message clear details nahi bata raha.
*   **Problem / Issue**: 
    1.  Lead claim karne ke baad bhi verifiers/closers lead ko edit nahi kar pa rahe thay kyunki unki global `can_edit_leads` permission off thi.
    2.  Toaster catches generic "Submission failed" error dikha rahe thay jiski waja se user ko problem ki sahi waja (jaise: lead locked hona) samajh nahi aa rahi thi.

---

### 4. Click Navigation Interceptions & Table Row Status (Prompt / Req 4)
*   **Aapka Prompt**: Claimed lead par pure row ka color change ho jaye taaki pehli fursat mein pata chale. Dusra, agar kisi aur ka claim hai toh lead click na ho sake aur warning toast message show ho ke kis verifier/closer ne use lock kiya hua hai.
*   **Problem / Issue**: Table rows dekh kar pata nahi chalta tha ke kaunsi lead free hai aur kis par already kaam ho raha hai, aur koi bhi locked leads ko click karke details page open kar leta tha.

---

### 5. Slow Loading Speed & Resetting Filters (Prompt / Req 5)
*   **Aapka Prompt**: Data barhne par page load slow ho raha hai. Iske ilawa, page refresh ya route change hone par custom filters automatic reset ho jate hain.
*   **Problem / Issue**:
    1.  Queries memory par documents count karti thin jo database barhne se page load speed gira rahi thi.
    2.  Filter states reload par persist nahi karti thin jisse multiple filters manage karne mein dushwari thi.

---

### 6. Filter Layout Refactoring (Prompt / Req 6)
*   **Aapka Prompt**: Dashboard par dropdown box filters ka grid ajeeb lag raha tha. Is se behtar hai ke ek single "Filter & Sort" button ho jo popup open kare aur usme saare filters khubsurat tareeqe se lage hon.
*   **Problem / Issue**: 6 alag dropdown select box pipeline page ke top space ko bohot zyada occupy aur clutter kar rahe thay.
