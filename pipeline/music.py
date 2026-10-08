import numpy as np, wave, sys
sr=44100; bpm=112; beat=60/bpm; bars=20; dur=bars*4*beat
n=int(dur*sr); t=np.arange(n)/sr; out=np.zeros((n,2))
def add(sig,start,pan=0.5,g=1.0):
    s=int(start*sr); e=min(n,s+len(sig)); 
    if s>=n: return
    out[s:e,0]+=sig[:e-s]*g*(1-pan)*2*0.5; out[s:e,1]+=sig[:e-s]*g*pan*2*0.5
def env(l,a=0.005,d=0.2):
    tt=np.arange(int(l*sr))/sr; return np.minimum(tt/a,1)*np.exp(-tt/d)
def kick():
    l=0.35; tt=np.arange(int(l*sr))/sr; f=50+90*np.exp(-tt*30); ph=2*np.pi*np.cumsum(f)/sr
    return np.sin(ph)*np.exp(-tt*9)
def hat(o=False):
    l=0.25 if o else 0.06; s=np.random.randn(int(l*sr)); s=np.diff(np.concatenate([[0],s]))
    return s*env(l,0.001,0.08 if o else 0.015)*0.25
def clap():
    l=0.2; s=np.random.randn(int(l*sr)); return s*env(l,0.002,0.06)*0.35
def saw(f,l):
    tt=np.arange(int(l*sr))/sr; return sum(np.sin(2*np.pi*f*k*tt)/k for k in range(1,8))
def note(m): return 440*2**((m-69)/12)
prog=[(57,[57,60,64]),(53,[53,57,60]),(48,[48,52,55,60]),(55,[55,59,62])]  # Am F C G
for b in range(bars):
    root,ch=prog[b%4]; t0=b*4*beat
    intro = b<2; outro = b>=bars-1
    for q in range(4):
        if not intro: add(kick(),t0+q*beat,0.5,0.9)
        if q in (1,3) and not intro: add(clap(),t0+q*beat,0.5,0.8)
        for e in range(2):
            add(hat(e==1 and q%2==1),t0+q*beat+e*beat/2,0.65,0.7 if not intro else 0.4)
    # bass 8ths
    if not intro:
        for e in range(8):
            l=beat/2*0.9; s=saw(note(root-24),l)*env(l,0.005,0.15)*0.22
            add(s,t0+e*beat/2,0.5)
    # pad
    l=4*beat; tt=np.arange(int(l*sr))/sr
    pad=sum(saw(note(m),l)*0.04 for m in ch)
    a=np.minimum(tt/0.4,1)*np.minimum((l-tt)/0.4,1); add(pad*a,t0,0.5,0.8)
    # arp pluck
    seq=ch+[ch[1]+12]
    for s16 in range(16):
        if intro and s16%2: continue
        m=seq[s16%len(seq)]+12; l=beat/4
        add(np.sin(2*np.pi*note(m)*np.arange(int(l*sr))/sr)*env(l,0.002,0.07)*0.12,t0+s16*beat/4,0.3 if s16%2 else 0.7)
# simple lowpass smooth + normalize + fade out
fade=int(2*sr); out[-fade:]*=np.linspace(1,0,fade)[:,None]
out/=np.max(np.abs(out))*1.1
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype(np.int16).tobytes()); w.close(); print(dur)
