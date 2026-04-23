"use client";

export default function PeppaPage() {
  return (
    <div style={{ 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>小猪佩奇 第九季 第41集</h1>
      
      {/* 视频容器：保持 16:9 比例 */}
      <div style={{ 
        width: '100%', 
        maxWidth: '800px', 
        aspectRatio: '16/9', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        <iframe 
  // 只保留核心暗号：BV1tLdYB2Env
  src="//player.bilibili.com/player.html?bvid=BV1tLdYB2Env&page=1&high_quality=1&danmaku=0" 
  style={{ width: '100%', height: '100%', border: 'none' }}
  allowFullScreen={true}
  // 加上这一行可以有效防止被 B 站拦截
  referrerPolicy="no-referrer" 
  scrolling="no"
></iframe>
      </div>

      <div style={{ marginTop: '30px', maxWidth: '800px', lineHeight: '1.6' }}>
        <h3>📝 听力练习说明：</h3>
        <p>1. 请认真观看上方视频。</p>
        <p>2. 注意佩奇和乔治在对话中使用的关键词。</p>
        <p>3. 观看结束后，请根据记忆回答下方的问题（代码逻辑已受保护，请放心编写）。</p>
      </div>

      {/* 这里你可以继续添加你的测验代码，就像之前那个 page.tsx 一样 */}
    </div>
  );
}