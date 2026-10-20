"""Prompt sets for zero-shot CLIP classification.

Each app label is described by several prompts; their text embeddings are averaged
(prompt ensembling), which is noticeably more robust than a single prompt.
"""

SPECIES_PROMPTS: dict[str, list[str]] = {
    "dog": ["a photo of a dog", "a photo of a stray dog", "a photo of a puppy", "a photo of an injured dog"],
    "cat": ["a photo of a cat", "a photo of a kitten", "a photo of a stray cat", "a photo of an injured cat"],
    "cow": ["a photo of a cow", "a photo of a calf", "a photo of a bull", "a photo of a buffalo", "a photo of cattle"],
    "bird": ["a photo of a bird", "a photo of a pigeon", "a photo of a crow", "a photo of a kite bird", "a photo of a parrot"],
    "monkey": ["a photo of a monkey", "a photo of a macaque", "a photo of a langur"],
    "wildlife": ["a photo of a deer", "a photo of a fox", "a photo of a jackal", "a photo of a wild animal", "a photo of a squirrel"],
    "reptile": ["a photo of a snake", "a photo of a lizard", "a photo of a turtle", "a photo of a tortoise", "a photo of a monitor lizard"],
    "other": ["a photo of a goat", "a photo of a donkey", "a photo of a horse", "a photo of a pig", "a photo of a rabbit"],
}

INJURY_PROMPTS: dict[str, list[str]] = {
    "injured": [
        "a photo of an injured animal",
        "a photo of a bleeding wounded animal",
        "a photo of an animal hit by a car lying on the road",
        "a photo of an animal with an open wound",
        "a photo of a sick and emaciated animal",
        "a photo of an animal that cannot stand up",
    ],
    "healthy": [
        "a photo of a healthy animal",
        "a photo of a happy animal standing",
        "a photo of an animal resting comfortably",
        "a photo of a well fed animal",
    ],
}
