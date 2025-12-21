-- 외국어 시술 후기 더미 데이터
-- 영어, 중국어, 일본어로 작성된 시술 후기

-- ============================================
-- 1. 영어 시술 후기 (English Review)
-- ============================================
INSERT INTO procedure_reviews (
  user_id,
  category,
  procedure_name,
  hospital_name,
  cost,
  procedure_rating,
  hospital_rating,
  gender,
  age_group,
  surgery_date,
  content,
  images
) VALUES (
  0,
  '눈성형',
  '쌍꺼풀 수술',
  '강남성형외과',
  150,
  5,
  5,
  '여',
  '30대',
  '2024-11-15',
  'I came to Korea from the US for double eyelid surgery, and I''m so happy with the results! The clinic was very professional, and the staff spoke English well. The procedure was quick and painless, and the recovery was faster than I expected. I highly recommend this clinic to anyone considering cosmetic surgery in Korea. The price was reasonable, and the quality of service was exceptional. I would definitely come back for other procedures!',
  NULL
);

-- ============================================
-- 2. 중국어 시술 후기 (Chinese Review)
-- ============================================
INSERT INTO procedure_reviews (
  user_id,
  category,
  procedure_name,
  hospital_name,
  cost,
  procedure_rating,
  hospital_rating,
  gender,
  age_group,
  surgery_date,
  content,
  images
) VALUES (
  0,
  '리프팅',
  '실리프팅',
  '압구정 피부과',
  150,
  4,
  5,
  '여',
  '40대',
  '2024-11-20',
  '我从中国来韩国做了线雕提升，效果非常好！医院的医生很专业，而且有中文翻译服务，沟通很方便。手术过程很快，几乎没有疼痛感。术后恢复也很快，现在已经过了两周，效果已经很明显了。价格也很合理，性价比很高。如果想在韩国做医美，强烈推荐这家医院！',
  NULL
);

-- ============================================
-- 3. 일본어 시술 후기 (Japanese Review)
-- ============================================
INSERT INTO procedure_reviews (
  user_id,
  category,
  procedure_name,
  hospital_name,
  cost,
  procedure_rating,
  hospital_rating,
  gender,
  age_group,
  surgery_date,
  content,
  images
) VALUES (
  0,
  '보톡스',
  '이마 보톡스',
  '청담동 피부과',
  80,
  5,
  5,
  '여',
  '20대',
  '2024-11-25',
  '日本から韓国に来て、おでこのボトックス注射を受けました。クリニックはとても清潔で、スタッフの対応も丁寧でした。日本語が通じるスタッフもいて安心でした。注射は痛みもほとんどなく、すぐに終わりました。効果も期待以上で、しわが目立たなくなりました。価格も日本と比べてお得で、満足しています。また韓国に来る機会があれば、他の施術も受けてみたいと思います。',
  NULL
);

