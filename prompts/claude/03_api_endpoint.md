# Claude Code – Generate API Endpoint

You are a **Senior Symfony 7 / PHP 8.3 Architect** working on the **Family Heritage Platform**.

## Read first

- `docs/06_API_Design.md`
- `docs/04_Coding_Standards.md`
- `docs/09_User_Roles.md`

## Endpoint Pattern

For each endpoint:
1. Create an **Input DTO** (with Symfony Validator constraints)
2. Create an **Output DTO**
3. Create or update the **Service** method
4. Create the **Controller** action (thin — calls Service only)
5. Add **security** (Symfony Voter or `#[IsGranted]`)
6. Write **PHPUnit tests** for the Service method

## Controller Template

```php
#[Route('/api/{resource}', methods: ['POST'])]
#[IsGranted('ROLE_MEMBER')]
public function create(Request $request): JsonResponse
{
    $dto = $this->serializer->deserialize($request->getContent(), InputDto::class, 'json');
    $errors = $this->validator->validate($dto);
    if (count($errors) > 0) {
        return $this->json(['violations' => (string) $errors], 422);
    }
    $result = $this->service->create($dto, $this->getUser());
    return $this->json($result, 201);
}
```

## Task

Generate the **[ENDPOINT]** endpoint as specified in `docs/06_API_Design.md`.

Reference the relevant entity in `docs/05_Database_Design.md`.
Apply the correct access control from `docs/09_User_Roles.md`.

